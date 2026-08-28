[← Step 7: Run and test the agent](../07-run-and-test-agent/README.md) · [Workshop overview](../../WORKSHOP.md)

# Reference & troubleshooting

Background you don't need to finish the workshop, but will want once you go beyond the sandbox
endpoint: spend controls, observability, supported networks, security considerations, and the
gotchas most likely to trip you up.

## Spend controls

AgentCore enforces spending at the **Payment Session** level (see
[Step 6](../06-payment-session/README.md)). There are no separate budget objects and no built-in
per-recipient allowlist at the session layer.

| Field | Description |
|---|---|
| `maxSpendAmount` | The ceiling for the session |
| `currency` | The session currency |
| `expiryTimeInMinutes` | Keep sessions short-lived (60 minutes or less in production); create a fresh session per user interaction rather than reusing a long-lived one |

If a payment would exceed the limit, or the session has expired, AgentCore denies it before
attempting to sign anything.

For **recipient-level** controls (e.g. blocking payments to specific addresses), attach a Privy
wallet [policy](https://docs.privy.io/wallets/security/policies) to the Payment Instrument's
wallet. Policies are enforced inside Privy's signing enclave, so they apply no matter which
session or agent initiated the payment, but the policy ID must be set at the moment the
PaymentInstrument is created, alongside the app ID, app secret, and authorization key.

## Observability

AgentCore Payments integrates with Amazon CloudWatch and AWS X-Ray. Once enabled, every data-plane
API call (`ProcessPayment`, `CreatePaymentInstrument`, `CreatePaymentSession`, etc.) emits vended
logs, metrics, and trace spans automatically. See the
[AgentCore Observability guide](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/observability.html).

**To enable it:**

1. Create a CloudWatch log group (e.g. `/bedrock-agentcore/payments/my-logs`).
2. Grant your IAM principal vended-log and X-Ray delivery permissions (`logs:CreateDelivery`,
   `xray:PutTraceSegments`, `bedrock-agentcore:AllowVendedLogDeliveryForResource`, and related).
3. On the Payment Manager details page, under **Log deliveries and tracing**, point log delivery
   at your log group and enable traces.

**Key metrics** published to CloudWatch: `PaymentRequestCount`, `PaymentSuccessCount`,
`PaymentFailureCount`, `PaymentLatency`, and `SpendAmount`, plus per-operation `OperationSuccess`,
`OperationFailure`, `OperationLatency`, `Throttles`, `UserErrors`, and `ActiveSessions`. Dimensions
include `Operation`, `PaymentManagerId`, `PaymentConnectorId`, `AgentName`, and `Currency`. Alarm
on `PaymentFailureCount` (a misconfiguration or abuse signal) and on `PaymentLatency` against your
own SLA.

**Spans** appear one per API call, named `Bedrock.AgentCore.Payments.<Operation>`, viewable in
X-Ray with payment-specific attributes: `spend_amount`, `spend_currency`, `merchant` (payTo),
`session_remaining_budget`, `total_budget_amount`, and `token_fetch_latency_ms`, alongside standard
AWS resource attributes.

## Supported networks

AgentCore Payments with Privy settles in **USDC**. When you create the PaymentInstrument
(Step 3), you choose a network *family*; the x402 challenge returned by the merchant then
specifies the exact chain within that family.

| Network family | Chains | Asset | Type |
|---|---|---|---|
| `ETHEREUM` | Base Sepolia (`base-sepolia` / `eip155:84532`) | USDC | Testnet, used in this workshop |
| `ETHEREUM` | Base (`eip155:8453`), Ethereum (`eip155:1`) | USDC | Mainnet |
| `SOLANA` | Solana Devnet (`solana-devnet`) | USDC | Testnet |
| `SOLANA` | Solana Mainnet | USDC | Mainnet |

Moving from this workshop's Base Sepolia setup to Base mainnet is a matter of changing the network
on the PaymentInstrument and funding the wallet with real USDC. The AgentCore/Privy plumbing
stays identical.

## Security considerations

- **User ownership.** AgentCore is an authorized signer, not the wallet owner (see
  [Concepts: who owns what](../00-concepts/README.md#who-owns-what)). The user grants delegation
  and can revoke it, or withdraw funds, at any time.
- **Credential isolation.** Privy credentials live in AgentCore Identity / Secrets Manager (see
  [Step 2](../02-agentcore-payment-manager/README.md#23-create-a-payment-auth)). Restrict the
  underlying secret to the AgentCore Payments service role only.
- **Session limits.** Per-session `maxSpendAmount` and short expiry bound runaway spending.
  Design agent prompts and tools assuming the session, not the agent's judgment, is the actual
  backstop.
- **Recipient screening.** Session limits bound *how much* an agent can spend, not *who* it can
  pay. Use a Privy wallet policy (above) if you need a recipient denylist.
- **HTTPS only.** Reject non-HTTPS targets in any tool that fetches paid resources, and block
  private/internal IP ranges to prevent SSRF via a malicious merchant URL.
- **Audit.** AgentCore Observability and AWS CloudTrail capture every `ProcessPayment` call; alarm
  on failed-payment spikes.
- **Rotate** the Privy App Secret and authorization key on a regular schedule (for example, every
  90 days) in any long-lived deployment.

## Testing tips

- Stay on Base Sepolia for development; get more testnet USDC any time from
  [Circle's faucet](https://faucet.circle.com/).
- Browse other live x402-enabled services at [x402scan.com](https://x402scan.com/) if you want to
  point the agent at something other than the sandbox endpoint.
- If the agent loops on `402` after what looked like a successful payment, the most common causes
  are an x402 version/header mismatch between agent and merchant, or an expired payment proof
  (roughly a 60-second validity window). Retry promptly rather than waiting.

## Troubleshooting

- **AgentCore rejects the authorization private key.** You likely forgot to strip the
  `wallet-auth:` prefix Privy adds to the generated key (see
  [Step 1](../01-privy-app-setup/README.md#15-note-the-authorization-id-and-private-key)).
- **`ProcessPayment` fails with "Delegation not completed".** The end user hasn't clicked
  **Connect Agent** in the frontend yet, or delegated a different wallet than the one referenced
  by `PAYMENT_INSTRUMENT_ID`. Revisit [Step 4](../04-delegate-signing/README.md).
- **Model access denied when running the agent.** Claude models on Bedrock require a one-time
  model-access request form; see `app/PaymentsAgent/model/load.py` for the model ID in use, and
  request access to it in the [Bedrock console](https://console.aws.amazon.com/bedrock/) under
  **Model access**.
- **`ModuleNotFoundError` for `dotenv` when running the agent.** `app/PaymentsAgent/payments.py`
  needs `python-dotenv`; make sure dependencies are synced (`uv sync` in `app/PaymentsAgent/`).
- **Agent never gets past the `402`.** Check that the payment session
  ([Step 6](../06-payment-session/README.md)) hasn't expired or exceeded its spend cap, and that
  the wallet ([Step 5](../05-fund-wallet/README.md)) actually has testnet USDC.

## Further reading

- [AWS Bedrock AgentCore Payments developer guide](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/payments.html)
- [AgentCore Payments launch blog](https://aws.amazon.com/blogs/machine-learning/agents-that-transact-introducing-amazon-bedrock-agentcore-payments-built-with-coinbase-and-stripe/)
- [AgentCore samples: end-to-end payment patterns](https://github.com/awslabs/agentcore-samples/tree/main/01-features/08-agents-that-transact)
- [Privy AgentCore SDK](https://github.com/privy-io/aws-agentcore-sdk) (the frontend vendored into `privy-frontend/`)
- [Privy authorization keys](https://docs.privy.io/wallets/security/authorization-keys)
- [AgentCore Identity](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/identity.html)
- [AgentCore Observability](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/observability.html)

---

[← Back to workshop overview](../../WORKSHOP.md)
