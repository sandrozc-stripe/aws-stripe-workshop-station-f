# Machine Payments Workshop: AWS Bedrock AgentCore + Stripe

An AWS/Stripe joint workshop. You'll build an AI agent on **Amazon Bedrock AgentCore** that can
**autonomously pay for machine-to-machine (x402 / MPP) protected APIs** — no human in the loop,
no credit card form. The agent settles payment from a testnet crypto wallet that *you* delegate
signing rights to, using **Stripe's Privy** as the embedded wallet provider.

By the end, your agent will hit a `402 Payment Required` response, pay for it automatically, and
return the paid content — using real (testnet) money moving on a real (testnet) blockchain.

> **No prior crypto/wallet experience assumed.** Every new concept (wallets, signers, testnets,
> the payment protocol itself) is explained inline, right where you first need it.

## What you'll build

```
┌─────────────┐   402 Payment Required    ┌──────────────────┐
│  Your Agent │ ─────────────────────────▶ │  Paid API/Tool   │
│ (AgentCore) │ ◀───────────────────────── │ (x402/MPP seller) │
└──────┬──────┘   200 OK + content         └──────────────────┘
       │  pays via
       ▼
┌─────────────────────┐      delegated signing      ┌───────────────┐
│ AgentCore Payments   │ ◀─────────────────────────  │ Your Privy    │
│ (Payment Manager /   │                              │ embedded      │
│  Connector / Session)│ ────────────────────────────▶│ wallet        │
└──────────────────────┘      pays from (testnet USDC) └───────────────┘
```

See [`docs/00-overview.md`](docs/00-overview.md) for the full architecture and a glossary of
every term used below.

## Modules

Work through these in order — each one builds on the last.

| # | Module | What you'll do |
|---|---|---|
| 0 | [Overview](docs/00-overview.md) | Understand the architecture and key concepts before touching anything |
| 1 | [Prerequisites](docs/01-prerequisites.md) | Set up accounts, CLIs, and the Bedrock model-access form |
| 2 | [AWS Payments setup](docs/02-aws-payments-setup.md) | Create a Payment Manager + Stripe (Privy) connector in the AWS console |
| 3 | [Privy dashboard setup](docs/03-privy-dashboard-setup.md) | Create a Privy app, get your API keys, create a signer key |
| 4 | [Agent project walkthrough](docs/04-agent-project-walkthrough.md) | Tour the agent code, find every "paste here" spot |
| 5 | [Provision wallet & session](docs/05-provision-wallet-and-session.md) | Create your agent's wallet and fill in `.env.local` |
| 6 | [Frontend delegation & funding](docs/06-frontend-delegation-and-funding.md) | Log in, delegate signing to your agent, fund the wallet on testnet |
| 7 | [Run and test the agent](docs/07-run-and-test-the-agent.md) | Run the agent locally and watch it autonomously pay for content |
| 8 | [Troubleshooting](docs/08-troubleshooting.md) | Symptom → cause → fix, for the gotchas you're most likely to hit |
| 9 | [Appendix: concepts & CLI reference](docs/09-appendix-concepts-glossary.md) | Standalone glossary + AgentCore CLI command reference |

## Repo layout

```
.
├── README.md                    <- you are here
├── AGENTS.md                    <- AgentCore project config reference (for AI coding assistants)
├── docs/                        <- the workshop guide (start with docs/00-overview.md)
├── agentcore/                   <- AgentCore project config (agentcore.json, .env.local, CDK)
├── app/PaymentsAgent/           <- the agent code (Strands + AgentCore Payments plugin)
└── privy-frontend/              <- delegation/funding web app (vendored from privy-io/aws-agentcore-sdk)
```

Start here: **[docs/00-overview.md](docs/00-overview.md)**.
