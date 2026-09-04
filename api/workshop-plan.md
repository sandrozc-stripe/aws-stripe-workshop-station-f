# Workshop Plan: AWS Lambda API with mppx, x402, and Stripe

## Objective

Build a TypeScript API on AWS Lambda, then protect `GET /content` with an x402-compatible payment implemented through `mppx`. The buyer is an Amazon Bedrock AgentCore agent with a Privy wallet. The seller receives Base/Base Sepolia USDC at a Stripe-managed deposit address and sees the settled transaction as a PaymentIntent in Stripe.

## Deliverables

1. Starter API:
   - Lambda, API Gateway HTTP API, CloudWatch Logs, and CDK.
   - `GET /content` returns generic JSON without payment.
2. Paid API:
   - `mppx@0.9` Base EVM charge method with x402 compatibility.
   - Stripe-managed Base deposit address.
   - Configurable x402 facilitator.
   - API Gateway/Web Request adapters preserving x402 headers.
   - Successful facilitator settlements recorded in Stripe.
3. Workshop documentation:
   - Sandbox setup and secret handling.
   - Base Sepolia buyer-wallet funding preflight.
   - Unpaid `402`, paid `200`, receipt, and Dashboard validation.

## Architecture

```text
AgentCore/Privy buyer
  -> API Gateway -> Lambda
  <- 402 + PAYMENT-REQUIRED
  -> PAYMENT-SIGNATURE
Lambda/mppx -> x402 facilitator -> Base settlement
Lambda/mppx -> Stripe transaction verification -> PaymentIntent
  <- 200 + PAYMENT-RESPONSE + content
```

MPP and x402 are separate protocols. `mppx` provides a Base EVM method that can expose both its native Payment-auth challenge and an x402 v2 challenge. The buyer can choose x402; this plan does not use the Tempo rail.

## Repository layout

```text
bin/workshop-api.ts
lib/api-stack.ts
src/handler.ts
src/http-adapters.ts
src/mpp-handler.solution.ts
test/handler.test.ts
test/http-adapters.test.ts
../workshop/00-public-api/README.md
../workshop/01-paid-api/README.md
.env.example
```

## Starter behavior

`GET /content` returns:

```json
{
  "message": "Hello from an AWS Lambda API.",
  "content": "This is generic workshop content.",
  "version": "starter"
}
```

Other paths and methods return `404`.

## Paid implementation

### Stripe machine-payments setup

Create the Stripe helper with the seller's key and profile:

```ts
const machinePayments = stripeMpp.create({
  client: stripeClient,
  depositAddresses: (network) =>
    stripeMpp.findOrCreateDepositAddress(stripeClient, network),
  livemode: process.env.STRIPE_LIVEMODE === "true",
  networkId: process.env.STRIPE_PROFILE_ID!,
});
```

Resolve a Base address, not a Tempo address:

```ts
const recipient = await machinePayments.findOrCreateDepositAddress("base");
```

### mppx/x402 method

```ts
const mppx = Mppx.create({
  methods: [
    machinePayments.base.charge({
      recipient,
      x402: {
        facilitator: process.env.X402_FACILITATOR_URL!,
      },
    }),
  ],
  realm: process.env.MPP_REALM,
  secretKey: process.env.MPP_SECRET_KEY!,
});

const charge = mppx.evm.charge({
  amount: process.env.MPP_AMOUNT ?? "0.01",
  description: "Access the workshop content API",
  scope: "GET /content",
});
```

The Stripe helper chooses Base Sepolia USDC when `livemode` is false and Base USDC when it is true. Its success hook takes the facilitator's transaction hash and creates an idempotent crypto PaymentIntent using Stripe transaction verification.

### Request lifecycle

1. Convert the API Gateway v2 event into a Web `Request`.
2. Invoke the `mppx.evm.charge` handler.
3. If status is `402`, return the challenge with all headers intact.
4. If paid, return the content through `withReceipt`.
5. Convert the Web `Response` back to the API Gateway result.

Headers that must survive the adapters:

- `PAYMENT-REQUIRED`
- `PAYMENT-SIGNATURE`
- `PAYMENT-RESPONSE`
- `WWW-Authenticate`
- `Authorization`

## Configuration

```env
MPP_AMOUNT=0.01
MPP_REALM=workshop-x402-api
MPP_SECRET_KEY=
STRIPE_LIVEMODE=false
STRIPE_PROFILE_ID=profile_test_...
STRIPE_SECRET_KEY=sk_test_...
X402_FACILITATOR_URL=https://x402.org/facilitator
```

Use the public facilitator only for supported test networks. Production must use a mainnet-compatible facilitator and its required authentication. Secrets belong in Secrets Manager or SSM for a production deployment.

## Validation

Automated checks:

```bash
npm run build:mpp-solution
npm test
npm run synth
```

Deployment checks:

1. Deploy the starter and verify `GET /content` returns `200`.
2. Deploy with `npm run deploy:mpp-solution`.
3. Call without payment and verify `402` plus an x402 `PAYMENT-REQUIRED` header.
4. Decode the requirement and verify Base Sepolia, USDC, amount, and Stripe `payTo` address.
5. Pay using the AgentCore buyer and verify `200` plus `PAYMENT-RESPONSE`.
6. Open the matching Stripe sandbox and verify the crypto PaymentIntent under Payments.

## Operational considerations

- Never log Stripe keys, wallet credentials, or payment authorizations.
- Use at least `$0.01`; smaller crypto amounts can't be represented as a Stripe PaymentIntent amount.
- Cache the initialized handler within a warm Lambda instance, as the reference implementation does.
- Use a facilitator supporting the challenged chain and USDC contract.
- Sandbox and live components must not be mixed.
- A challenge is not proof of payment. Return protected content only after verification and settlement.
- For live mode, use an authenticated mainnet facilitator and understand that tests move real funds.

## Out of scope

- Tempo payments and seller-sponsored Tempo fees.
- Subscriptions, refunds, disputes, and Connect destination charges.
- Buyer-agent implementation beyond retrieving/funding its existing Base wallet.
- Production facilitator credential management beyond documenting the requirement.
