#!/usr/bin/env bash
# Deploy salafy-portfolio to the operator's OWN AWS account (aws/stack.yaml).
#
# This is run BY A HUMAN OPERATOR, never by the build agent. It performs
# resource-changing AWS calls (cloudformation deploy, s3 sync, lambda update).
#
# Usage:
#   scripts/deploy-aws.sh \
#     --profile P --region R \
#     --github-repo owner/name \
#     --github-client-id ID \
#     [--site-origin https://...] \
#     [--domain d --cert-arn arn] \
#     [--create-oidc] \
#     [--stack-name salafy-portfolio]
#
# Prereqs: AWS CLI v2, zip, node/npm; Bedrock model access enabled in --region;
# the GitHub OAuth App client secret stored in SSM (see docs/DEPLOY.md).
set -euo pipefail

PROFILE=""
REGION=""
GITHUB_REPO=""
GITHUB_CLIENT_ID=""
SITE_ORIGIN=""
DOMAIN=""
CERT_ARN=""
CREATE_OIDC="false"
STACK_NAME="salafy-portfolio"

die() { echo "error: $*" >&2; exit 1; }

while [[ $# -gt 0 ]]; do
  case "$1" in
    --profile) PROFILE="$2"; shift 2 ;;
    --region) REGION="$2"; shift 2 ;;
    --github-repo) GITHUB_REPO="$2"; shift 2 ;;
    --github-client-id) GITHUB_CLIENT_ID="$2"; shift 2 ;;
    --site-origin) SITE_ORIGIN="$2"; shift 2 ;;
    --domain) DOMAIN="$2"; shift 2 ;;
    --cert-arn) CERT_ARN="$2"; shift 2 ;;
    --create-oidc) CREATE_OIDC="true"; shift 1 ;;
    --stack-name) STACK_NAME="$2"; shift 2 ;;
    *) die "unknown argument: $1" ;;
  esac
done

[[ -n "$PROFILE" ]] || die "--profile is required"
[[ -n "$REGION" ]] || die "--region is required"
[[ -n "$GITHUB_CLIENT_ID" ]] || die "--github-client-id is required"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

AWS=(aws --profile "$PROFILE" --region "$REGION")

ACCOUNT_ID="$("${AWS[@]}" sts get-caller-identity --query Account --output text)"
ARTIFACTS_BUCKET="${STACK_NAME}-artifacts-${ACCOUNT_ID}-${REGION}"

echo "==> account=${ACCOUNT_ID} region=${REGION} stack=${STACK_NAME}"

# 1) Build the static export + Lambda zip. Use placeholders tolerant build on
#    first pass when SITE_ORIGIN is not yet known (we rebuild admin config later).
echo "==> build:aws (pass 1)"
if [[ -n "$SITE_ORIGIN" ]]; then
  SITE_ORIGIN="$SITE_ORIGIN" GITHUB_REPO="$GITHUB_REPO" npm run build:aws
else
  GITHUB_REPO="$GITHUB_REPO" npm run build:aws -- --allow-placeholders
fi

# 2) Ensure the private CFN artifacts bucket exists (create once).
if ! "${AWS[@]}" s3api head-bucket --bucket "$ARTIFACTS_BUCKET" 2>/dev/null; then
  echo "==> creating artifacts bucket ${ARTIFACTS_BUCKET}"
  if [[ "$REGION" == "us-east-1" ]]; then
    "${AWS[@]}" s3api create-bucket --bucket "$ARTIFACTS_BUCKET"
  else
    "${AWS[@]}" s3api create-bucket --bucket "$ARTIFACTS_BUCKET" \
      --create-bucket-configuration "LocationConstraint=${REGION}"
  fi
  "${AWS[@]}" s3api put-public-access-block --bucket "$ARTIFACTS_BUCKET" \
    --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
  "${AWS[@]}" s3api put-bucket-encryption --bucket "$ARTIFACTS_BUCKET" \
    --server-side-encryption-configuration \
    '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
fi

# 3) Upload the Lambda zip to the artifacts bucket.
ZIP_KEY="lambda/api-$(date +%Y%m%d%H%M%S).zip"
echo "==> upload deploy/api.zip -> s3://${ARTIFACTS_BUCKET}/${ZIP_KEY}"
"${AWS[@]}" s3 cp deploy/api.zip "s3://${ARTIFACTS_BUCKET}/${ZIP_KEY}"

# 4) Deploy the CloudFormation stack.
echo "==> cloudformation deploy"
PARAMS=(
  "SiteOrigin=${SITE_ORIGIN}"
  "GitHubClientId=${GITHUB_CLIENT_ID}"
  "GitHubRepo=${GITHUB_REPO}"
  "CreateOidcProvider=${CREATE_OIDC}"
  "BedrockRegion=${REGION}"
)
if [[ -n "$DOMAIN" ]]; then
  [[ -n "$CERT_ARN" ]] || die "--cert-arn is required with --domain"
  PARAMS+=("DomainName=${DOMAIN}" "AcmCertificateArn=${CERT_ARN}")
fi

"${AWS[@]}" cloudformation deploy \
  --stack-name "$STACK_NAME" \
  --template-file aws/stack.yaml \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --parameter-overrides "${PARAMS[@]}"

# 5) Read stack outputs.
get_output() {
  "${AWS[@]}" cloudformation describe-stacks --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" --output text
}
SITE_URL="$(get_output SiteUrl)"
BUCKET="$(get_output BucketName)"
DIST_ID="$(get_output DistributionId)"
FUNCTION="$(get_output FunctionName)"
CALLBACK_URL="$(get_output ApiCallbackUrl)"

echo "==> outputs: SiteUrl=${SITE_URL} Bucket=${BUCKET} Dist=${DIST_ID} Fn=${FUNCTION}"

# 6) If SITE_ORIGIN was not supplied, use SiteUrl and rebuild so admin config +
#    stack's SITE_ORIGIN env agree, then redeploy the stack with it.
if [[ -z "$SITE_ORIGIN" ]]; then
  SITE_ORIGIN="$SITE_URL"
  echo "==> rebuild with SITE_ORIGIN=${SITE_ORIGIN}"
  SITE_ORIGIN="$SITE_ORIGIN" GITHUB_REPO="$GITHUB_REPO" npm run build:aws
  PARAMS2=("SiteOrigin=${SITE_ORIGIN}" "GitHubClientId=${GITHUB_CLIENT_ID}"
    "GitHubRepo=${GITHUB_REPO}" "CreateOidcProvider=${CREATE_OIDC}" "BedrockRegion=${REGION}")
  if [[ -n "$DOMAIN" ]]; then
    PARAMS2+=("DomainName=${DOMAIN}" "AcmCertificateArn=${CERT_ARN}")
  fi
  "${AWS[@]}" cloudformation deploy \
    --stack-name "$STACK_NAME" \
    --template-file aws/stack.yaml \
    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
    --parameter-overrides "${PARAMS2[@]}"
fi

# 7) Sync the static site with cache headers.
echo "==> s3 sync static site -> s3://${BUCKET}"
# Immutable, long-cache for hashed Next assets.
"${AWS[@]}" s3 sync deploy/site "s3://${BUCKET}" \
  --delete \
  --exclude "*.html" --exclude "*.xml" --exclude "*.json" --exclude "*.yml" \
  --cache-control "public,max-age=31536000,immutable"
# Re-sync HTML/feeds/config with no-cache so content updates appear immediately.
"${AWS[@]}" s3 sync deploy/site "s3://${BUCKET}" \
  --exclude "*" \
  --include "*.html" --include "*.xml" --include "*.json" --include "*.yml" \
  --cache-control "no-cache"

# 8) Update the Lambda code.
echo "==> lambda update-function-code"
"${AWS[@]}" lambda update-function-code \
  --function-name "$FUNCTION" \
  --s3-bucket "$ARTIFACTS_BUCKET" --s3-key "$ZIP_KEY" >/dev/null

# 9) Invalidate CloudFront.
echo "==> cloudfront invalidation"
"${AWS[@]}" cloudfront create-invalidation \
  --distribution-id "$DIST_ID" --paths "/*" >/dev/null

echo ""
echo "Done."
echo "  SiteUrl:      ${SITE_URL}"
echo "  OAuth callback (set in GitHub OAuth App): ${CALLBACK_URL}"
