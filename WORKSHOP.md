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
> [Step 2: Concepts](workshop/02-concepts/README.md) and again inline, right where you first need
> it.

## What you'll build

```
┌─────────────┐   402 Payment Required    ┌───────────────────┐
│  Your Agent │ ─────────────────────────▶ │  Paid API/Tool    │
│ (AgentCore) │ ◀───────────────────────── │ (x402/MPP seller)  │
└──────┬──────┘   200 OK + content         └───────────────────┘
       │  pays via
       ▼
┌───────────────────────┐    delegated signing    ┌───────────────┐
│ AgentCore Payments     │ ◀───────────────────────│ Your Privy    │
│ (Payment Manager /     │                          │ embedded      │
│  Connector / Session)  │ ────────────────────────▶│ wallet        │
└─────────────────────────┘   pays from (testnet USDC) └─────────────┘
```

## Prerequisites

- An AWS account that can deploy Lambda, API Gateway, and CloudWatch resources, with access to [Amazon Bedrock AgentCore](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/what-is-bedrock-agentcore.html), and the [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) installed.
- A Stripe account created with the United States as its business location, plus a sandbox with **Stablecoins and Crypto** activated.
- A [Privy](https://www.privy.io/) account (free); this is where your agent's wallet infrastructure lives.
- Node.js 20 or newer for the seller API and the `privy-frontend/` app.
- Python 3.10+ with [`uv`](https://docs.astral.sh/uv/) for `app/PaymentsAgent/` and `main/`, and the [`agentcore` CLI](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/getting-started-cli.html) (`pip install bedrock-agentcore-starter-toolkit` or equivalent).
- For the buyer phase, a root `.env` file: copy `.env.example` to `.env` (never commit this, see
  `.gitignore`) and fill in each value as you work through the agent steps.
  `app/PaymentsAgent/.env.example` covers the subset the agent itself needs at runtime. The
  seller's separate `api/.env` is created in Step 1.

## Work through the steps in order

All participant instructions live under [`workshop/`](workshop/). Complete the seller phase
first, then continue directly into the buyer-agent phase.

| Step | Chapter | What you'll do |
|---|---|---|
| 0 | [Build and Deploy the Public API](workshop/00-public-api/README.md) | Deploy a public Lambda endpoint as the control case |
| 1 | [Add the HTTP 402 Paid API](workshop/01-paid-api/README.md) | Protect the same endpoint with x402 and Stripe machine payments |
| 2 | [Understand AgentCore Payments and Privy](workshop/02-concepts/README.md) | Learn the resources and runtime payment flow before configuring the buyer |
| 3 | [Create Your Privy App & Authorization Key](workshop/03-privy-app-setup/README.md) | Sign up for Privy, get API keys, and generate the signer key AgentCore will use |
| 4 | [Create an AgentCore Payment Manager + Connector](workshop/04-agentcore-payment-manager/README.md) | Wire your Privy credentials into AWS in the console |
| 5 | [Provision the Agent's Wallet](workshop/05-provision-wallet/README.md) | Create the end user's embedded wallet via AgentCore |
| 6 | [Delegate Signing Rights via the Frontend](workshop/06-delegate-signing/README.md) | Log in as the end user and approve the agent as a wallet signer |
| 7 | [Fund the Wallet on Testnet](workshop/07-fund-wallet/README.md) | Get free testnet USDC on Base Sepolia and confirm it landed |
| 8 | [Create a Payment Session](workshop/08-payment-session/README.md) | Set a time-boxed, spend-capped budget for the agent to operate under |
| 9 | [Run the Agent and Watch It Pay](workshop/09-run-and-test-agent/README.md) | Run the agent locally and watch it autonomously pay your API |
| 10 | [Reference & Troubleshooting](workshop/10-reference/README.md) | Review spend controls, observability, security, supported networks, and common gotchas |

## Repo layout

```
.
├── WORKSHOP.md                  <- you are here
├── README.md                    <- project overview and workshop entry point
├── workshop/                    <- all seller API and buyer agent chapters
├── api/                         <- Lambda/API Gateway seller implementation
├── main/                        <- one-off provisioning scripts (Steps 5 and 8)
├── agentcore/                   <- AgentCore project config (agentcore.json, .env.local, CDK)
├── app/PaymentsAgent/           <- the agent code (Strands + AgentCore Payments plugin)
└── privy-frontend/              <- delegation/funding web app (Step 6)
```

Start here: **[Step 0: Build and Deploy the Public API](workshop/00-public-api/README.md)**.
