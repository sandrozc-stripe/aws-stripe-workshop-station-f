# Machine Payments Workshop: AWS Bedrock AgentCore + Stripe (Privy)

An AWS/Stripe joint workshop. You'll build an AI agent on **[Amazon Bedrock
AgentCore](https://docs.aws.amazon.com/bedrock-agentcore/)** that can **autonomously pay for
machine-to-machine (x402 / MPP) protected APIs**, with no human in the loop and no credit card
form. The agent settles payment from a testnet crypto wallet that *you* delegate signing rights
to, using **[Privy](https://www.privy.io/)** (a Stripe company) as the embedded wallet provider.

By the end, your agent will hit a `402 Payment Required` response, pay for it automatically, and
return the paid content, using real (testnet) money moving on a real (testnet) blockchain.

> **No prior crypto/wallet experience assumed.** Every new concept (wallets, signers, testnets,
> the payment protocol itself) is explained in [Concepts](workshop/00-concepts/README.md) and
> again inline, right where you first need it.

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

- An AWS account with access to [Amazon Bedrock AgentCore](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/what-is-bedrock-agentcore.html), and the [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) installed.
- A [Privy](https://www.privy.io/) account (free); this is where your agent's wallet infrastructure lives.
- Python 3.10+ with [`uv`](https://docs.astral.sh/uv/) for `app/PaymentsAgent/` and `main/`, and the [`agentcore` CLI](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/getting-started-cli.html) (`pip install bedrock-agentcore-starter-toolkit` or equivalent).
- Node.js for the `privy-frontend/` app.
- A root `.env` file: copy `.env.example` to `.env` (never commit this, see `.gitignore`) and
  fill in each value as you work through the steps below. `app/PaymentsAgent/.env.example` covers
  the subset of those values the agent itself needs at runtime.

## Work through the steps in order

Each step lives in its own folder under [`workshop/`](workshop/), with its own explanation and
screenshots. Start with Concepts, then follow the numbered steps straight through.

| # | Step | What you'll do |
|---|---|---|
| 0 | [Concepts](workshop/00-concepts/README.md) | Understand the resources (PaymentManager, Connector, Instrument, Session) and the runtime payment flow before touching anything |
| 1 | [Create your Privy app & authorization key](workshop/01-privy-app-setup/README.md) | Sign up for Privy, get API keys, generate the signer key AgentCore will use |
| 2 | [Create an AgentCore Payment Manager + Connector](workshop/02-agentcore-payment-manager/README.md) | Wire your Privy credentials into AWS, in the console |
| 3 | [Provision the agent's wallet](workshop/03-provision-wallet/README.md) | Create the end user's embedded wallet via AgentCore |
| 4 | [Delegate signing rights via the frontend](workshop/04-delegate-signing/README.md) | Log in as the end user and approve the agent as a wallet signer |
| 5 | [Fund the wallet on testnet](workshop/05-fund-wallet/README.md) | Get free testnet USDC on Base Sepolia and confirm it landed |
| 6 | [Create a payment session](workshop/06-payment-session/README.md) | Set a time-boxed, spend-capped budget for the agent to operate under |
| 7 | [Run and test the agent](workshop/07-run-and-test-agent/README.md) | Run the agent locally and watch it autonomously pay for content |
| 8 | [Reference & troubleshooting](workshop/08-reference/README.md) | Spend controls, observability, security, supported networks, and common gotchas |

## Repo layout

```
.
├── WORKSHOP.md                  <- you are here
├── README.md                    <- short project overview
├── workshop/                    <- the step-by-step guide (start with workshop/00-concepts/)
├── main/                        <- one-off provisioning scripts (Steps 3 and 6)
├── agentcore/                   <- AgentCore project config (agentcore.json, .env.local, CDK)
├── app/PaymentsAgent/           <- the agent code (Strands + AgentCore Payments plugin)
└── privy-frontend/              <- delegation/funding web app (Step 4)
```

Start here: **[Concepts](workshop/00-concepts/README.md)**.
