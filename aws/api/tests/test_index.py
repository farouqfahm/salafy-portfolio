"""Unit tests for the salafy-portfolio API Lambda (aws/api/index.py).

Run from aws/api:   python3 -m unittest

boto3 and urllib are stubbed, so no real network or AWS calls happen. The
Bedrock Converse client is a fake that can be scripted to return a plain reply
or a tool-use round. DynamoDB is an in-memory table; SSM returns a fake secret.
"""
import base64
import importlib
import json
import os
import sys
import types
import unittest
from unittest import mock

HERE = os.path.dirname(__file__)
API_DIR = os.path.abspath(os.path.join(HERE, ".."))
if API_DIR not in sys.path:
    sys.path.insert(0, API_DIR)


# --------------------------------------------------------------------------- #
# Fakes                                                                        #
# --------------------------------------------------------------------------- #


class FakeTable:
    """In-memory DynamoDB table supporting put_item and the rate-limit update."""

    def __init__(self):
        self.items = {}

    def put_item(self, Item):
        self.items[Item["pk"]] = Item

    def update_item(self, Key, UpdateExpression, ExpressionAttributeValues, ReturnValues):
        pk = Key["pk"]
        cur = self.items.get(pk, {})
        c = int(cur.get("c", 0)) + 1
        cur["pk"] = pk
        cur["c"] = c
        cur["expiresAt"] = ExpressionAttributeValues[":ttl"]
        self.items[pk] = cur
        return {"Attributes": {"c": c}}


class FakeBedrock:
    """Scriptable Converse client. `script` is a list of response dicts."""

    def __init__(self, script):
        self.script = list(script)
        self.calls = []

    def converse(self, **kwargs):
        self.calls.append(kwargs)
        return self.script.pop(0)


class FakeSsm:
    def __init__(self, value="ghp_fake_secret"):
        self.value = value

    def get_parameter(self, Name, WithDecryption):
        return {"Parameter": {"Value": self.value}}


def plain_reply(text):
    return {
        "stopReason": "end_turn",
        "output": {"message": {"role": "assistant", "content": [{"text": text}]}},
    }


def tool_use_round(name, tool_input, tool_use_id="t1"):
    return {
        "stopReason": "tool_use",
        "output": {
            "message": {
                "role": "assistant",
                "content": [{"toolUse": {"toolUseId": tool_use_id, "name": name, "input": tool_input}}],
            }
        },
    }


# --------------------------------------------------------------------------- #
# Module import with boto3 stubbed                                             #
# --------------------------------------------------------------------------- #


def load_index(env=None, table=None, bedrock=None, ssm=None):
    """(Re)import index with a stubbed boto3 and given env/clients."""
    table = table if table is not None else FakeTable()
    ssm = ssm if ssm is not None else FakeSsm()

    fake_boto3 = types.SimpleNamespace()

    def resource(name, *a, **k):
        assert name == "dynamodb"
        return types.SimpleNamespace(Table=lambda _n: table)

    def client(name, *a, **k):
        if name == "bedrock-runtime":
            return bedrock
        if name == "ssm":
            return ssm
        raise AssertionError(f"unexpected client {name}")

    fake_boto3.resource = resource
    fake_boto3.client = client

    base_env = {
        "TABLE_NAME": "t",
        "BEDROCK_REGION": "us-east-1",
        "BEDROCK_MODEL_ID": "model-x",
        "SITE_ORIGIN": "https://site.example",
        "GITHUB_CLIENT_ID": "cid",
        "GITHUB_SECRET_PARAM": "/p/secret",
        "BOOKING_URL": "https://cal.boardy.ai/farouqfahm",
    }
    if env:
        base_env.update(env)

    # Persist env for the whole call (handlers read os.environ at call time, not
    # just at import), and stub boto3 for the import + any lazy client creation.
    os.environ.update(base_env)
    with mock.patch.dict(sys.modules, {"boto3": fake_boto3}):
        if "index" in sys.modules:
            del sys.modules["index"]
        index = importlib.import_module("index")
    # Keep boto3 stubbed on the imported module so lazy clients use the fakes.
    index.boto3 = fake_boto3
    index._table_obj_for_test = table
    return index, table


def ev(method="POST", route="leads", body=None, b64=False, headers=None, qs=None, cookies=None, source_ip="1.2.3.4"):
    raw = ""
    is_b64 = False
    if body is not None:
        raw = body if isinstance(body, str) else json.dumps(body)
        if b64:
            raw = base64.b64encode(raw.encode()).decode()
            is_b64 = True
    return {
        "rawPath": f"/api/{route}",
        "isBase64Encoded": is_b64,
        "body": raw,
        "headers": headers or {},
        "queryStringParameters": qs,
        "cookies": cookies or [],
        "requestContext": {"http": {"method": method, "sourceIp": source_ip}},
    }


VALID_LEAD = {
    "type": "Investor",
    "timeline": "This week",
    "need": "We invest in climate data startups and want to talk.",
    "org": "GreenVC",
    "name": "Jane Doe",
    "email": "jane@greenvc.com",
}


# --------------------------------------------------------------------------- #
# Leads                                                                        #
# --------------------------------------------------------------------------- #


class TestLeads(unittest.TestCase):
    def test_valid(self):
        index, table = load_index()
        r = index.handler(ev(body=VALID_LEAD), None)
        self.assertEqual(r["statusCode"], 200)
        b = json.loads(r["body"])
        self.assertTrue(b["ok"])
        self.assertEqual(b["tier"], "Hot")
        self.assertTrue(b["delivered"])
        self.assertTrue(any(k.startswith("lead#") for k in table.items))

    def test_base64_body(self):
        index, _ = load_index()
        r = index.handler(ev(body=VALID_LEAD, b64=True), None)
        self.assertEqual(r["statusCode"], 200)
        self.assertTrue(json.loads(r["body"])["ok"])

    def test_bad_email(self):
        index, _ = load_index()
        bad = dict(VALID_LEAD, email="not-an-email")
        r = index.handler(ev(body=bad), None)
        self.assertEqual(r["statusCode"], 400)
        self.assertEqual(json.loads(r["body"])["error"], "Email looks wrong")

    def test_bad_type(self):
        index, _ = load_index()
        bad = dict(VALID_LEAD, type="Spammer")
        r = index.handler(ev(body=bad), None)
        self.assertEqual(r["statusCode"], 400)
        self.assertEqual(json.loads(r["body"])["error"], "Pick who you are")

    def test_honeypot(self):
        index, table = load_index()
        hp = dict(VALID_LEAD, website="http://spam")
        r = index.handler(ev(body=hp), None)
        self.assertEqual(r["statusCode"], 200)
        self.assertEqual(json.loads(r["body"]), {"ok": True})
        self.assertFalse(any(k.startswith("lead#") for k in table.items))

    def test_scoring_tiers(self):
        index, _ = load_index()
        hot = index.score_lead(VALID_LEAD)
        self.assertEqual(hot[1], "Hot")  # 40 + 30 + 15 + short need (<60) = 85
        warm = index.score_lead(
            {"type": "Press", "timeline": "This month", "org": "", "need": "short"}
        )
        self.assertEqual(warm[0], 45)  # 25 + 20
        self.assertEqual(warm[1], "Cool")
        # Founder + This month + org + short need: 15 + 20 + 15 = 50 -> Warm
        warm2 = index.score_lead(
            {"type": "Founder or partner", "timeline": "This month", "org": "Acme", "need": "short"}
        )
        self.assertEqual(warm2[0], 50)
        self.assertEqual(warm2[1], "Warm")

    def test_method_not_allowed(self):
        index, _ = load_index()
        r = index.handler(ev(method="GET", route="leads"), None)
        self.assertEqual(r["statusCode"], 405)

    def test_rate_limit_hit(self):
        index, _ = load_index()
        last = None
        for _ in range(6):
            last = index.handler(ev(body=VALID_LEAD, source_ip="9.9.9.9"), None)
        self.assertEqual(last["statusCode"], 429)


# --------------------------------------------------------------------------- #
# Chat                                                                         #
# --------------------------------------------------------------------------- #


class TestChat(unittest.TestCase):
    def test_plain_reply(self):
        bedrock = FakeBedrock([plain_reply("ClimatrixAI scores climate risk from satellite data.")])
        index, _ = load_index(bedrock=bedrock)
        body = {"messages": [{"role": "user", "content": "What is ClimatrixAI?"}], "lang": "en"}
        r = index.handler(ev(route="chat", body=body), None)
        self.assertEqual(r["statusCode"], 200)
        b = json.loads(r["body"])
        self.assertTrue(b["ok"])
        self.assertIn("ClimatrixAI", b["reply"])
        self.assertNotIn("lead_saved", b)

    def test_save_lead_tool_round(self):
        bedrock = FakeBedrock(
            [
                tool_use_round("save_lead", VALID_LEAD),
                plain_reply("Thanks Jane, I've shared your details with Umar."),
            ]
        )
        index, table = load_index(bedrock=bedrock)
        body = {
            "messages": [{"role": "user", "content": "I'm Jane from GreenVC, jane@greenvc.com, investor, this week."}],
            "lang": "en",
        }
        r = index.handler(ev(route="chat", body=body), None)
        self.assertEqual(r["statusCode"], 200)
        b = json.loads(r["body"])
        self.assertTrue(b["ok"])
        self.assertTrue(b["lead_saved"])
        self.assertTrue(any(k.startswith("lead#") for k in table.items))
        self.assertEqual(len(bedrock.calls), 2)

    def test_booking_tool_round(self):
        bedrock = FakeBedrock(
            [tool_use_round("get_booking_link", {}), plain_reply("Here is Umar's booking link.")]
        )
        index, _ = load_index(bedrock=bedrock)
        body = {"messages": [{"role": "user", "content": "Can I book a call?"}]}
        r = index.handler(ev(route="chat", body=body), None)
        b = json.loads(r["body"])
        self.assertEqual(b["booking_url"], "https://cal.boardy.ai/farouqfahm")

    def test_bad_input_empty_messages(self):
        index, _ = load_index(bedrock=FakeBedrock([]))
        r = index.handler(ev(route="chat", body={"messages": []}), None)
        self.assertEqual(r["statusCode"], 400)

    def test_bad_input_too_long(self):
        index, _ = load_index(bedrock=FakeBedrock([]))
        body = {"messages": [{"role": "user", "content": "x" * 2001}]}
        r = index.handler(ev(route="chat", body=body), None)
        self.assertEqual(r["statusCode"], 400)

    def test_chat_rate_limit(self):
        bedrock = FakeBedrock([plain_reply("ok")] * 31)
        index, _ = load_index(bedrock=bedrock)
        body = {"messages": [{"role": "user", "content": "hi"}]}
        last = None
        for _ in range(31):
            last = index.handler(ev(route="chat", body=body, source_ip="7.7.7.7"), None)
        self.assertEqual(last["statusCode"], 429)


# --------------------------------------------------------------------------- #
# Geo                                                                          #
# --------------------------------------------------------------------------- #


class TestGeo(unittest.TestCase):
    def test_arab_true(self):
        index, _ = load_index()
        r = index.handler(ev(method="GET", route="geo", headers={"CloudFront-Viewer-Country": "SA"}), None)
        b = json.loads(r["body"])
        self.assertEqual(b["country"], "SA")
        self.assertTrue(b["arab"])
        self.assertEqual(r["headers"]["cache-control"], "no-store")

    def test_arab_false(self):
        index, _ = load_index()
        r = index.handler(ev(method="GET", route="geo", headers={"CloudFront-Viewer-Country": "US"}), None)
        b = json.loads(r["body"])
        self.assertEqual(b["country"], "US")
        self.assertFalse(b["arab"])

    def test_missing_header(self):
        index, _ = load_index()
        r = index.handler(ev(method="GET", route="geo"), None)
        b = json.loads(r["body"])
        self.assertIsNone(b["country"])
        self.assertFalse(b["arab"])


# --------------------------------------------------------------------------- #
# Auth + callback                                                             #
# --------------------------------------------------------------------------- #


class TestAuth(unittest.TestCase):
    def test_auth_redirect_and_cookie(self):
        index, _ = load_index()
        r = index.handler(ev(method="GET", route="auth"), None)
        self.assertEqual(r["statusCode"], 302)
        loc = r["headers"]["location"]
        self.assertTrue(loc.startswith("https://github.com/login/oauth/authorize?"))
        self.assertIn("client_id=cid", loc)
        self.assertIn("scope=repo", loc)
        self.assertIn("redirect_uri=https%3A%2F%2Fsite.example%2Fapi%2Fcallback", loc)
        cookie = r["headers"]["set-cookie"]
        self.assertIn("cms_oauth_state=", cookie)
        self.assertIn("HttpOnly", cookie)
        self.assertIn("Secure", cookie)
        self.assertIn("SameSite=Lax", cookie)
        self.assertIn("Path=/api", cookie)

    def test_callback_state_mismatch(self):
        index, _ = load_index()
        r = index.handler(
            ev(
                method="GET",
                route="callback",
                qs={"code": "abc", "state": "wrong"},
                cookies=["cms_oauth_state=real"],
            ),
            None,
        )
        self.assertEqual(r["statusCode"], 400)
        self.assertIn("authorization:github:error:", r["body"])

    def test_callback_success_page(self):
        captured = {}

        class FakeResp:
            def __init__(self, payload):
                self._p = json.dumps(payload).encode()

            def read(self):
                return self._p

            def __enter__(self):
                return self

            def __exit__(self, *a):
                return False

        def fake_urlopen(req, timeout=0):
            captured["url"] = req.full_url
            return FakeResp({"access_token": "gho_abc123"})

        index, _ = load_index()
        with mock.patch.object(index.urllib.request, "urlopen", fake_urlopen):
            r = index.handler(
                ev(
                    method="GET",
                    route="callback",
                    qs={"code": "thecode", "state": "match"},
                    cookies=["cms_oauth_state=match"],
                ),
                None,
            )
        self.assertEqual(r["statusCode"], 200)
        body = r["body"]
        # Handshake + SITE_ORIGIN origin check + token present.
        self.assertIn("authorization:github:success:", body)
        self.assertIn("gho_abc123", body)
        self.assertIn("authorizing:github", body)
        self.assertIn("https://site.example", body)
        self.assertIn("e.origin !== allowed", body)
        self.assertEqual(captured["url"], index.GITHUB_TOKEN)

    def test_callback_missing_code(self):
        index, _ = load_index()
        r = index.handler(
            ev(method="GET", route="callback", qs={"state": "x"}, cookies=["cms_oauth_state=x"]),
            None,
        )
        self.assertEqual(r["statusCode"], 400)


# --------------------------------------------------------------------------- #
# Dispatch misc                                                               #
# --------------------------------------------------------------------------- #


class TestDispatch(unittest.TestCase):
    def test_unknown_route(self):
        index, _ = load_index()
        r = index.handler(ev(method="GET", route="nope"), None)
        self.assertEqual(r["statusCode"], 404)

    def test_geo_wrong_method(self):
        index, _ = load_index()
        r = index.handler(ev(method="POST", route="geo"), None)
        self.assertEqual(r["statusCode"], 405)


if __name__ == "__main__":
    unittest.main()
