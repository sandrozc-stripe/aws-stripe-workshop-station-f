# 00 — Overview

## What you're building

An AI agent, hosted on **Amazon Bedrock AgentCore**, that can browse the web on your behalf and,
when it hits content that requires payment, **pay for it itself** — no human approves the
transaction in the moment. The money comes from a small, budget-capped testnet wallet that you
control and explicitly delegate to the agent.

This is what "machine payments" means: a payment protocol designed for a *machine* — not a human
sitting at a checkout page — to be the one presenting payment.

## The moving parts

```
                     1. GET /paid-endpoint
   ┌─────────────┐ ─────────────────────────▶ ┌───────────────────┐
   │  Your Agent │                             │  Paid API/Tool    │
   │ (AgentCore  │ ◀───────────────────────── │  (x402/MPP seller)│
   │  Runtime)   │   2. 402 Payment Required   └───────────────────┘
   └──────┬──────┘                                       ▲
          │ 3. "I need to pay this"                      │
          ▼                                    5. GET again, now with
   ┌─────────────────────┐                        a payment proof attached
   │ AgentCore Payments  │ ─────────────────────────────────────┘
   │ ProcessPayment API  │
   └──────────┬──────────┘
              │ 4. sign + settle, using your delegated wallet
              ▼
   ┌──────────────────────┐
   │ Your Privy embedded  │   (testnet USDC on Base Sepolia)
   │ wallet                │
   └──────────────────────┘
```

Step by step:

1. Your agent calls a tool (e.g. `http_request`) against some URL.
2. The server responds `402 Payment Required` instead of the content — this is the signal that
   payment is needed before the content will be served.
3. AgentCore's **Payments plugin**, wired into your agent, notices the 402 and intercepts it.
4. It calls the **AgentCore Payments `ProcessPayment` API**, which — using the wallet you
   delegated in Module 06 — signs and settles a small payment on-chain.
5. The plugin retries the original request, this time with a payment proof attached. The server
   verifies it and returns the real content.

Everything from step 3 onward happens automatically, inside the plugin — your agent's code and
prompt don't need to know any of this is happening; it just sees the final content.

## Concept glossary

> **Concept: Payment Manager, Connector, Instrument, Session**
>
> These four AgentCore Payments resources form a chain, each one narrower than the last:
> - A **Payment Manager** is the top-level control-plane object for your whole payments setup —
>   one per project, roughly. You create this once, in the AWS console (Module 02).
> - A **Connector** tells the Payment Manager *how* to talk to a wallet provider — in this
>   workshop, Stripe's Privy. It holds the provider credentials (App ID/secret, signer key).
> - An **Instrument** is one specific wallet, tied to one specific end user (identified by email).
>   You'll create one for yourself in Module 05.
> - A **Session** is a budget-capped, time-limited window during which the agent is allowed to
>   spend from an instrument — e.g. "up to $5, for the next 60 minutes." This is what actually
>   limits how much an autonomous agent can spend without you checking in again.

> **Concept: Embedded / custody-less wallet**
>
> A traditional crypto wallet requires the user to hold a private key themselves (in a browser
> extension, a hardware device, etc.). An **embedded wallet** (what Privy provides) is created and
> held for the user by the wallet provider, but the user still controls it — they log in with
> something familiar like an email address, rather than managing a seed phrase. This is what makes
> it practical to spin up a wallet for a workshop attendee in seconds.

> **Concept: Signer / delegation / authorization key**
>
> Normally, only the wallet's owner can authorize a transaction. Since your agent needs to spend
> from *your* wallet without asking you every single time, you create a **signer** (Privy calls
> this an "Authorization key") and explicitly **delegate** signing rights for your wallet to it.
> This is the single most important trust boundary in the whole system: delegation is scoped,
> revocable, and separate from your own login credentials — you're never handing over your actual
> account password or seed phrase, just permission for this one signer to transact on your behalf.
> You'll see this exact screen in Module 03.

> **Concept: Testnet vs. mainnet**
>
> Blockchains have production networks (**mainnet**, where tokens have real monetary value) and
> parallel test networks (**testnet**, where tokens are free and worthless outside of testing).
> This workshop uses **Base Sepolia**, the testnet for the Base chain, and testnet USDC obtained
> for free from a **faucet** (a service that hands out small amounts of testnet currency on
> request). Nothing in this workshop costs real money or touches mainnet.

> **Concept: x402 and MPP**
>
> **x402** is a protocol (from Coinbase/Cloudflare) that reuses the HTTP `402 Payment Required`
> status code — long reserved in the HTTP spec but rarely implemented — as a machine-readable
> "pay me this much, this way, to get this content" signal. **MPP** (Machine Payments Protocol,
> from Stripe/Tempo) is a related, protocol-agnostic scheme for the same problem, using the
> standard HTTP `WWW-Authenticate` challenge/response pattern instead of a custom body format.
> AgentCore Payments speaks both — your agent doesn't need to know or care which one a given
> seller uses; the same `ProcessPayment` call handles either.

## What's next

Continue to [**01-prerequisites.md**](01-prerequisites.md) to get your accounts and tools set up.
