# Machine Payments Workshop: AWS + Stripe

This joint AWS and Stripe workshop walks through both sides of an autonomous machine payment.
First, you'll build and deploy an API on **AWS Lambda**, then protect it with an **HTTP 402/x402**
payment boundary backed by **Stripe machine payments**. Next, you'll build a buyer agent on
**Amazon Bedrock AgentCore** that can discover the price, pay the API, and return its protected
content without a checkout form or a human approving the payment in the moment.

The agent pays with testnet USDC from a wallet whose owner explicitly delegates signing rights,
using **Privy** (a Stripe company) as the embedded wallet provider. By the end, you will have a
complete seller-and-buyer flow running across AWS, Stripe, AgentCore Payments, and Base Sepolia.

> **No prior crypto/wallet experience assumed.** Every new concept (wallets, signers, testnets,
> the payment protocol itself) is explained inline, right where you first need it.

## What you'll build

<p align="center">
  <img src="diagram/overview.png" width="760" alt="Architecture overview: Your Agent calls a Paid API/Tool over x402, paying via AgentCore Payments, which settles from your Privy embedded wallet under delegated signing">
</p>

The workshop has two connected phases:

1. **Build the seller:** deploy a free API, add the x402 paywall, and observe its
   `402 Payment Required` challenge.
2. **Build the buyer:** configure a funded AgentCore/Privy wallet, delegate payment authority,
   and run an agent that pays the API automatically.

## Start the workshop

Begin with **[Step 0: Build and Deploy the Public API](workshop/00-public-api/README.md)**.

See the **[full workshop outline](WORKSHOP.md)** for prerequisites and every chapter.

## Repo layout

```
.
├── README.md                    <- you are here
├── WORKSHOP.md                  <- prerequisites and complete workshop outline
├── diagram/                     <- editable .drawio sources + exported PNGs for the diagrams above
├── workshop/                    <- all seller API and buyer agent workshop chapters
├── api/                         <- Lambda/API Gateway seller implementation
├── main/                        <- one-off provisioning scripts (wallet + payment session)
├── agentcore/                   <- AgentCore project config (agentcore.json, .env.local, CDK)
├── app/PaymentsAgent/           <- the agent code (Strands + AgentCore Payments plugin)
└── privy-frontend/              <- delegation/funding web app (vendored from privy-io/aws-agentcore-sdk)
```
