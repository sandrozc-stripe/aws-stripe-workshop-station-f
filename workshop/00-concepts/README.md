[← Back to workshop overview](../../WORKSHOP.md) · [Next: Step 1 — Create your Privy app →](../01-privy-app-setup/README.md)

# Concepts — how AgentCore Payments and Privy fit together

Read this before touching any console or terminal. Every later step refers back to the resources
and vocabulary introduced here.

## The problem this solves

AI agents increasingly call paid APIs, MCP servers, and paywalled content. Providers are starting
to monetize per-request, using the HTTP `402 Payment Required` status code — but individual
requests are often worth fractions of a cent, far below what a credit card network can process
economically. [Amazon Bedrock AgentCore Payments](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/payments.html)
is AWS's managed answer to that problem: it lets an agent settle these *microtransactions*
autonomously, in stablecoin, over an open protocol (**x402** / the **Machine Payments Protocol,
MPP**), while a developer-configured budget keeps spending bounded.

AgentCore Payments does not hold funds itself. It orchestrates a **wallet provider** — in this
workshop, [Privy](https://www.privy.io/) (a Stripe company) — which holds the actual **embedded
crypto wallet** on behalf of your end user. AgentCore's job is to own the payment *lifecycle*:
storing provider credentials safely, enforcing per-session spend limits, requesting a signature
from the wallet provider, and returning a payment proof the agent can hand back to the merchant.

## Who owns what

This is the one idea worth internalizing before Step 1: **the wallet belongs to your end user, not
to the agent or to AWS.** AgentCore is only ever an *authorized signer* on that wallet, and only
after the user explicitly delegates that authority (Step 4). The user can revoke it, and can
withdraw funds, at any time. This is why the workshop has a dedicated frontend step — signing that
delegation is not something an API call can do on the user's behalf.

## The five resources you'll create

| Resource | Created in | Purpose |
|---|---|---|
| **PaymentCredentialProvider** | AWS console, Step 2 | Stores your Privy `App ID` / `App Secret` / authorization key inside [AgentCore Identity](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/identity.html) (backed by AWS Secrets Manager). The agent runtime never reads these directly. |
| **PaymentManager** | AWS console, Step 2 | The top-level coordinator for your account. Defines how callers authenticate to it (`AWS_IAM` or `CUSTOM_JWT`) and which IAM role AgentCore assumes to do payment work. |
| **PaymentConnector** | AWS console, Step 2 | Binds the PaymentManager to a specific provider — here, a `StripePrivy` connector referencing the credential provider above. |
| **PaymentInstrument** | `main/1_create_payment_instrument_wallet.py`, Step 3 | The end user's wallet. Created via AgentCore's `CreatePaymentInstrument` API (type `EMBEDDED_CRYPTO_WALLET`) — **not** through the Privy SDK directly. AgentCore provisions the underlying Privy embedded wallet and hands back its address. |
| **PaymentSession** | `main/2_create_payment_session.py`, Step 6 | A time-boxed spending context (`maxSpendAmount`, `currency`, `expiryTimeInMinutes`). Once it expires or its limit is hit, AgentCore denies further payments in that session — no signing is even attempted. |

At runtime there's a sixth moving part, an API call rather than a standing resource:
**`ProcessPayment`** — the call the agent's tooling makes every time it hits a `402`. AgentCore
checks the session's remaining budget, asks Privy to sign, and returns the proof.

## The runtime flow

```
1. Agent calls a paid resource (x402)          →  402 Payment Required
2. Agent's tool calls AgentCore ProcessPayment  →  session limit checked
3. AgentCore asks Privy to sign                 →  x402 payment proof returned
4. Agent retries the request with the proof     →  200 OK + paid content
```

```
 Your Agent  ──────────(1) GET resource───────────▶  Paid API / MCP / content
 Your Agent  ◀─────────    402 Payment Required ────
 Your Agent  ──────────(2) ProcessPayment──────────▶  AgentCore Payments
 AgentCore   ──────────(3) sign via Identity───────▶  Privy embedded wallet
 Your Agent  ──────────(4) retry + signed proof────▶  Paid API / MCP / content
 Your Agent  ◀─────────    200 OK + content ────────
```

In this workshop, steps 1–4 above happen automatically inside the `AgentCorePaymentsPlugin`
wired into `app/PaymentsAgent/payments.py` — you'll never call `ProcessPayment` yourself. Your job
across Steps 1–6 is entirely provisioning: get the five resources above into existence and into
your `.env` files, so that plugin has something to call against.

## Why this needs its own AWS *and* Privy setup

Two providers, two jobs:

- **AWS Bedrock AgentCore** hosts and runs your agent, and owns the payment orchestration —
  budgets, sessions, credential storage, observability.
- **Privy** owns the wallet infrastructure — key generation, embedded wallet creation, and the
  end-user consent flow that grants AgentCore signing rights.

You'll set up Privy first (Step 1), because AgentCore's payment connector needs Privy credentials
to exist before it can be created (Step 2).

---

Continue to **[Step 1 — Create your Privy app & authorization key](../01-privy-app-setup/README.md)**.
