# 07 — Run and Test the Agent

This is the payoff: run the agent locally and watch it autonomously pay for content.

## 1. Start the local dev server

From the repo root:

```bash
agentcore dev -l
```

You should see it start up and initialize the payments plugin:

```
Server: http://localhost:8080/invocations
...
INFO [bedrock_agentcore.payments.integrations.strands.plugin] - Initialized AgentCorePaymentsPlugin
INFO:     Application startup complete.
```

If instead you see an error about the Bedrock model, read on before troubleshooting further.

> **Troubleshooting:** If you see
> `ResourceNotFoundException: Model use case details have not been submitted for this account`,
> your AWS account hasn't completed the Bedrock model-access form from
> [Module 01](01-prerequisites.md) — this only affects Claude models. The agent ships pointed at
> Amazon Nova Lite by default specifically to avoid this; if you changed `model/load.py` to a
> Claude model, either submit the form and wait ~15 minutes, or switch back. See
> [Module 08](08-troubleshooting.md).

## 2. Send a prompt that triggers a payment

In a new terminal, from the repo root:

```bash
agentcore dev "Fetch https://sandbox.node4all.com/v1/x402-test and tell me what you find."
```

This URL is a public x402 test endpoint that always returns `402 Payment Required` until paid.

> **Concept: watching x402 happen**
>
> This is the flow from [Module 00](00-overview.md) playing out for real: the agent calls
> `http_request`, gets a 402, and the Payments plugin — not the model, not your prompt — notices
> it, calls `ProcessPayment` against your session, retries with a payment proof attached, and
> hands the model the real response. The model never "decides" to pay; the payment happens at the
> tool layer, invisibly to the conversation.

A successful run's final answer looks something like:

```
The fetched content from the URL indicates a successful response with the following details:
- Status: Success
- Fortune: "A mass adoption event is closer than you think."
- Lucky Number: 21
...
```

## 3. Confirm the payment actually happened

Check the dev server logs (path printed at startup, under `agentcore/.cli/logs/dev/`) for the
payment sequence:

```bash
grep -i "402\|payment" agentcore/.cli/logs/dev/dev-<timestamp>.log
```

You should see this sequence:

```
HTTP Request: GET https://sandbox.node4all.com/v1/x402-test "HTTP/1.1 402 Payment Required"
Detected 402 Payment Required response from tool: http_request
Retrieving payment instrument ...
Processing payment of type CRYPTO_X402 ...
Successfully processed payment ...
Added payment header to tool input headers: ['PAYMENT-SIGNATURE']
HTTP Request: GET https://sandbox.node4all.com/v1/x402-test "HTTP/1.1 200 OK"
```

The `402` → payment → `200 OK` sequence is your proof: the agent genuinely paid for the content,
using the wallet you funded and delegated in Module 06.

> **Troubleshooting:** If instead you see `AccessDeniedException` on `GetPaymentInstrument` in the
> logs, `agentcore dev` picked up the wrong AWS identity — see the note in
> [Module 05](05-provision-wallet-and-session.md#3-fill-in-agentcoreenvlocal) and
> [Module 08](08-troubleshooting.md).

## Congratulations

Your agent can now autonomously discover and pay for machine-to-machine protected content —
end to end, from AWS console setup to a real (testnet) settled payment.

## What's next

[**08-troubleshooting.md**](08-troubleshooting.md) has a consolidated list of every gotcha
mentioned across this guide, in one place, if you want a quick reference. The
[**appendix**](09-appendix-concepts-glossary.md) has the full concept glossary plus the AgentCore
CLI command reference.
