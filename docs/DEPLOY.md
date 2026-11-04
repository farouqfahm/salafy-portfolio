# Deploying salafy-portfolio to AWS

This site ships as a static export on **CloudFront + private S3**, with a
Python **Lambda** behind an **API Gateway HTTP API** for the dynamic routes
(leads, Bedrock chat, geo, Decap CMS GitHub OAuth). Everything is one
CloudFormation stack: `aws/stack.yaml`.

The site is served at the **root** of the distribution (no sub-path).

## Prerequisites

1. **AWS CLI v2** with a profile that can create IAM/CloudFront/Lambda/S3/DynamoDB
   (`aws configure --profile <P>` or `aws sso login --profile <P>`).
2. **Enable Bedrock model access** for the Claude model in your region
   (Bedrock console → *Model access* → enable
   `anthropic.claude-haiku-4-5` / the inference profile
   `us.anthropic.claude-haiku-4-5-20251001-v1:0`). To use a different model,
   pass a different `BedrockModelId` parameter (any Claude Converse-capable
   model/inference profile you have enabled), e.g.
   `us.anthropic.claude-sonnet-4-5-20250929-v1:0`.
3. **GitHub OAuth App** for Decap CMS login
   (GitHub → *Settings* → *Developer settings* → *OAuth Apps* → *New*):
   - Homepage URL: your SiteUrl.
   - **Authorization callback URL**: the `ApiCallbackUrl` stack output
     (`<SiteUrl>/api/callback`). On the very first deploy you don't know the
     SiteUrl yet — deploy once, read the output, then set the callback URL and
     redeploy (the deploy script does the rebuild automatically).
   - Note the **Client ID** and generate a **Client Secret**.
4. **Store the client secret in SSM** (the operator does this by hand; the
   agent never touches it):

   ```sh
   aws ssm put-parameter \
     --name /salafy-portfolio/github-client-secret \
     --type SecureString \
     --value '<the client secret>' \
     --profile <P> --region <R>
   ```

   Change `--name` only if you also change the `GitHubSecretParam` stack
   parameter.

## First deploy

```sh
scripts/deploy-aws.sh \
  --profile <P> --region us-east-1 \
  --github-repo <owner>/<name> \
  --github-client-id <GITHUB_OAUTH_CLIENT_ID> \
  --create-oidc            # only the FIRST time in this account
```

What the script does: `build:aws` → create a private CFN artifacts bucket (once)
→ upload `deploy/api.zip` → `cloudformation deploy` → read outputs → if no
`--site-origin` was given, reuse the resulting SiteUrl, rebuild the admin config
and redeploy → `s3 sync` the site (immutable cache for hashed assets, no-cache
for HTML/feeds) → `lambda update-function-code` → CloudFront invalidation.
It prints **SiteUrl** and the **OAuth callback URL**.

Custom domain (ACM cert must be in **us-east-1**):

```sh
scripts/deploy-aws.sh --profile <P> --region us-east-1 \
  --github-repo <owner>/<name> --github-client-id <ID> \
  --domain umarfahm.com --cert-arn arn:aws:acm:us-east-1:<acct>:certificate/<id>
```

Point your DNS (`CNAME`/alias) at the distribution domain after it deploys.

> The agent never runs this script or any resource-changing `aws` command.

## GitHub Actions (CMS edits → auto rebuild)

`.github/workflows/deploy.yml` runs on push to `main` (paths `content/**`,
`src/**`, `public/**`, `aws/**`, `scripts/**`) and on manual dispatch. It builds
and deploys via **OIDC** — no long-lived keys. Set these **repository
variables** (Settings → Secrets and variables → Actions → *Variables*):

| Variable | Value |
| --- | --- |
| `AWS_DEPLOY_ROLE_ARN` | `DeployRoleArn` stack output |
| `AWS_REGION` | your deploy region (e.g. `us-east-1`) |
| `SITE_ORIGIN` | your SiteUrl (e.g. `https://umarfahm.com`) |
| `SITE_BUCKET` | `BucketName` stack output |
| `API_FUNCTION_NAME` | `FunctionName` stack output |
| `CF_DISTRIBUTION_ID` | `DistributionId` stack output |

The deploy role trusts `repo:<owner>/<name>:ref:refs/heads/main` and can only
`s3 sync` the bucket, invalidate the distribution and update the function code.

When an editor saves in Decap CMS (`/admin`), Decap commits the Markdown to
`content/**` on `main`, which triggers this workflow and republishes the site.

## Cost notes

Low-traffic personal site: effectively a few dollars/month or less.
S3 + CloudFront are pennies at this scale; Lambda and DynamoDB (on-demand with
TTL on rate-limit rows) stay in/near the free tier. The real variable cost is
**Bedrock**, billed per token on the chat route — Haiku is inexpensive, and the
route is rate limited to 30 messages per IP per hour, 600 output tokens each.

## Teardown

```sh
# Empty the site bucket + artifacts bucket first (CFN won't delete non-empty buckets).
aws s3 rm "s3://<BucketName>" --recursive --profile <P> --region <R>
aws s3 rm "s3://salafy-portfolio-artifacts-<acct>-<region>" --recursive --profile <P> --region <R>
aws cloudformation delete-stack --stack-name salafy-portfolio --profile <P> --region <R>
```

The SSM secret and the GitHub OAuth App are not part of the stack — delete them
separately if you no longer need them.
