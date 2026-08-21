# 09 — Appendix: Concepts Glossary & CLI Reference

## Concepts glossary

A standalone reference for every concept introduced across this guide.

| Term | Definition |
|---|---|
| **Payment Manager** | The top-level AgentCore Payments control-plane object for a project. Created once in the AWS console ([Module 02](02-aws-payments-setup.md)). |
| **Connector** | Tells a Payment Manager how to talk to a specific wallet provider (e.g. Stripe/Privy), holding that provider's credentials. |
| **Payment Instrument** | One wallet, tied to one end user by email. Created per-user via `setup_payment_user.py` ([Module 05](05-provision-wallet-and-session.md)). |
| **Payment Session** | A budget-capped, time-limited window in which an agent may spend from an instrument. |
| **Embedded / custody-less wallet** | A crypto wallet created and held by a provider (Privy) on the user's behalf, accessible via familiar login (email) rather than a seed phrase. |
| **Signer / Authorization key** | A key that can be delegated authority to sign transactions for a wallet, distinct from the wallet owner's own login. Created in the Privy dashboard ([Module 03](03-privy-dashboard-setup.md)). |
| **Delegation** | The explicit, revocable act of granting a signer authority over a specific wallet — done by the wallet's owner, in the Privy frontend ([Module 06](06-frontend-delegation-and-funding.md)). |
| **Testnet / Mainnet** | Parallel blockchain networks: mainnet has real monetary value, testnet is free and used only for development/testing. This workshop uses Base Sepolia, a testnet. |
| **Faucet** | A service that distributes free testnet currency on request (e.g. the [Circle faucet](https://faucet.circle.com/)). |
| **x402** | A payment protocol (Coinbase/Cloudflare) that uses the HTTP `402 Payment Required` status with a custom response body to signal machine-payable content. |
| **MPP (Machine Payments Protocol)** | A related protocol (Stripe/Tempo) for machine-to-machine payments, using the standard HTTP `WWW-Authenticate` challenge/response pattern. AgentCore Payments supports both x402 and MPP through the same API. |
| **Inbound auth / IAM identity** | The AWS identity permitted to call payment APIs against a given Payment Manager — configured when the manager is created, and a common source of `AccessDeniedException` if your local AWS credentials don't match it. |

## AgentCore CLI reference

This project was scaffolded with the [AgentCore CLI](https://github.com/aws/agentcore-cli). Useful
commands beyond what this workshop already walks through:

| Command | Description |
| --- | --- |
| `agentcore create` | Create a new AgentCore project |
| `agentcore add` | Add resources (agent, memory, credential, gateway, evaluator, policy, payment-manager, payment-connector) |
| `agentcore remove` | Remove resources |
| `agentcore dev` | Run agent locally with hot-reload |
| `agentcore deploy` | Deploy to AWS via CDK |
| `agentcore status` | Show deployment status |
| `agentcore invoke` | Invoke agent (local or deployed) |
| `agentcore logs` | View agent logs |
| `agentcore traces` | View agent traces |
| `agentcore eval` | Run evaluations |
| `agentcore package` | Package agent artifacts |
| `agentcore validate` | Validate configuration |
| `agentcore pause` / `agentcore resume` | Pause/resume a deployed agent |
| `agentcore fetch` | Fetch remote resource definitions |
| `agentcore import` | Import existing resources |
| `agentcore update` | Check for CLI updates |

### Project structure

```
.
├── AGENTS.md               # AI coding assistant context
├── agentcore/
│   ├── agentcore.json      # Project config (agents, memories, credentials, gateways, evaluators, payments)
│   ├── aws-targets.json    # Deployment targets (account + region)
│   ├── .env.local          # Secrets — API keys (gitignored)
│   ├── .env.local.example  # Template for the above (this workshop's addition)
│   ├── .llm-context/       # TypeScript type definitions for AI assistants
│   └── cdk/                # CDK infrastructure (@aws/agentcore-cdk)
└── app/                    # Agent application code
```

The project uses a **flat resource model** — agents, memories, credentials, gateways, evaluators,
and policies are top-level arrays in `agentcore.json`. This workshop's Payment Manager and
connector were created directly in the AWS console rather than via `agentcore add
payment-manager`, so `agentcore.json`'s `payments` array stays empty — that's expected, not a
misconfiguration.

### Further reading

- [AgentCore CLI](https://github.com/aws/agentcore-cli)
- [AgentCore CDK Constructs](https://github.com/aws/agentcore-l3-cdk-constructs)
- [Amazon Bedrock AgentCore](https://aws.amazon.com/bedrock/agentcore/)
- [privy-io/aws-agentcore-sdk](https://github.com/privy-io/aws-agentcore-sdk) — upstream source for `privy-frontend/`
