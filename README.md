# Machine Payments Workshop: AWS Bedrock AgentCore + Stripe

An AWS/Stripe joint workshop. You'll build an AI agent on **Amazon Bedrock AgentCore** that can
**autonomously pay for machine-to-machine (x402 / MPP) protected APIs**, with no human in the
loop and no credit card form. The agent settles payment from a testnet crypto wallet that *you*
delegate signing rights to, using **Stripe's Privy** as the embedded wallet provider.

By the end, your agent will hit a `402 Payment Required` response, pay for it automatically, and
return the paid content, using real (testnet) money moving on a real (testnet) blockchain.

> **No prior crypto/wallet experience assumed.** Every new concept (wallets, signers, testnets,
> the payment protocol itself) is explained inline, right where you first need it.

## What you'll build

<p align="center">
  <img src="diagram/overview.png" width="760" alt="Architecture overview: Your Agent calls a Paid API/Tool over x402, paying via AgentCore Payments, which settles from your Privy embedded wallet under delegated signing">
</p>

## Repo layout

```
.
├── README.md                    <- you are here
├── WORKSHOP.md                  <- the full step-by-step guide
├── diagram/                     <- editable .drawio sources + exported PNGs for the diagrams above
├── workshop/                    <- the step-by-step guide, one folder per step
├── main/                        <- one-off provisioning scripts (wallet + payment session)
├── agentcore/                   <- AgentCore project config (agentcore.json, .env.local, CDK)
├── app/PaymentsAgent/           <- the agent code (Strands + AgentCore Payments plugin)
└── privy-frontend/              <- delegation/funding web app (vendored from privy-io/aws-agentcore-sdk)
```

See **[WORKSHOP.md](WORKSHOP.md)** for the full step-by-step guide.
