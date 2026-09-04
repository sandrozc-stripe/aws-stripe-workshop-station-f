[← Project Overview](../README.md)

# Machine Payments Workshop: AWS + Stripe

In this joint AWS and Stripe workshop, you'll build an x402-protected seller API and the AI agent
that buys from it. The seller runs on AWS Lambda and records successful machine payments with
Stripe. The buyer runs on **[Amazon Bedrock AgentCore](https://docs.aws.amazon.com/bedrock-agentcore/)**
and pays from a **[Privy](https://www.privy.io/)** embedded wallet under limits enforced by
AgentCore Payments.

By the end, your agent will call your API, receive `402 Payment Required`, pay it automatically,
and return the protected content using testnet USDC on Base Sepolia.

> **No prior crypto/wallet experience assumed.** Every new concept (wallets, signers, testnets,
> the payment protocol itself) is explained in
> [Step 3: Concepts](03-concepts/README.md) and again inline, right where you first need
> it.
>
## Prerequisites

- An AWS account that can deploy Lambda, API Gateway, and CloudWatch resources, with access to [Amazon Bedrock AgentCore](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/what-is-bedrock-agentcore.html), and the [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) installed.
- A Stripe account created with the United States as its business location, plus a sandbox with **Stablecoins and Crypto** activated.
- A [Privy](https://www.privy.io/) account (free); this is where your agent's wallet infrastructure lives.
- Node.js 20 or newer for the seller API and the `privy-frontend/` app.
- Python 3.10+ with [`uv`](https://docs.astral.sh/uv/) for `app/PaymentsAgent/` and `main/`, and the [`agentcore` CLI](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/getting-started-cli.html) (`pip install bedrock-agentcore-starter-toolkit` or equivalent).
- One root `.env` file for the entire workshop: copy [`.env.example`](../.env.example) to `.env`
  (never commit this, see [`.gitignore`](../.gitignore)) and fill in each value as you work through
  the steps below, in both phases.
  Every script, the seller API's deploy commands, and the agent's runtime all read this same file.
  The one exception is `privy-frontend/` (Step 7), a separate vendored Next.js app that keeps its
  own `.env` because Next.js can only load environment files from its own project root.

## Work through the steps in order

All participant instructions live right here, in this `workshop/` directory. Complete Phase 1
first, then continue directly into Phase 2. Don't skip the prerequisites above — jumping straight
into Step 1 without them is the most common way to get blocked partway through a step.

### Phase 1 — Build the seller API

Fully self-contained: by the end of Step 2 you have a deployed, paid API and don't need any
wallet, agent, or AgentCore concepts yet.

| Step | Chapter | What you'll do |
|---|---|---|
| 1 | [Build and Deploy the Public API](01-public-api/README.md) | Deploy a public Lambda endpoint as the control case |
| 2 | [Add the HTTP 402 Paid API](02-paid-api/README.md) | Protect the same endpoint with x402 and Stripe machine payments |

### Phase 2 — Build the buyer agent

Configure a funded AgentCore/Privy wallet, delegate payment authority to your agent, and run it
against the API you just built.

| Step | Chapter | What you'll do |
|---|---|---|
| 3 | [Understand AgentCore Payments and Privy](03-concepts/README.md) | Learn the resources and runtime payment flow before configuring the buyer |
| 4 | [Create Your Privy App & Authorization Key](04-privy-app-setup/README.md) | Sign up for Privy, get API keys, and generate the signer key AgentCore will use |
| 5 | [Create an AgentCore Payment Manager + Connector](05-agentcore-payment-manager/README.md) | Wire your Privy credentials into AWS in the console |
| 6 | [Provision the Agent's Wallet](06-provision-wallet/README.md) | Create the end user's embedded wallet via AgentCore |
| 7 | [Delegate Signing Rights via the Frontend](07-delegate-signing/README.md) | Log in as the end user and approve the agent as a wallet signer |
| 8 | [Fund the Wallet on Testnet](08-fund-wallet/README.md) | Get free testnet USDC on Base Sepolia and confirm it landed |
| 9 | [Create a Payment Session](09-payment-session/README.md) | Set a time-boxed, spend-capped budget for the agent to operate under |
| 10 | [Run the Agent and Watch It Pay](10-run-and-test-agent/README.md) | Run the agent locally and watch it autonomously pay your API |

### Reference

| Step | Chapter | What you'll do |
|---|---|---|
| 11 | [Reference & Troubleshooting](11-reference/README.md) | Review spend controls, observability, security, supported networks, and common gotchas |

## Repo layout

```
.
├── README.md                    <- project overview, links in here
├── .env.example                 <- the ONE env template for the whole workshop (copy to .env)
├── workshop/
│   ├── README.md                <- you are here: full outline + prerequisites
│   ├── 01-public-api/ .. 11-reference/  <- one directory per step above
├── api/                         <- Lambda/API Gateway seller implementation (Phase 1)
├── main/                        <- one-off provisioning scripts (Steps 6 and 9)
├── agentcore/                   <- AgentCore project config (agentcore.json, CDK)
├── app/PaymentsAgent/           <- the agent code (Strands + AgentCore Payments plugin)
└── privy-frontend/              <- delegation/funding web app, with its own .env (Step 7)
```

Start here: **[Step 1: Build and Deploy the Public API](01-public-api/README.md)**.
