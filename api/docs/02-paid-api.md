# Part 2: Add the HTTP 402 Paid API

## Goal

You will add a monetization boundary around the existing `GET /content` endpoint:

```text
request without payment
  -> HTTP 402 Payment Required + PAYMENT-REQUIRED challenge

request with a valid x402 payment signature
  -> verify and settle payment
  -> HTTP 200 + PAYMENT-RESPONSE receipt + content
```

You will create one application file: `src/mpp-handler.ts`. The API Gateway stack and the Web `Request`/`Response` adapters are already provided, so you will only implement the paywall.

Complete [Part 1](01-free-api.md) first so that you have a deployed free API and its full URL.

## Before you start

You need:

- a Stripe account created with **United States** as its business location
- a Stripe sandbox belonging to that account
- the **Stablecoins and Crypto** payment method activated in that sandbox
- a sandbox Stripe secret key (`sk_test_...`)
- a Stripe Profile created in that sandbox and its Profile ID (`profile_test_...`)
- an x402 facilitator that supports Base Sepolia

Complete the Stripe setup in this order:

1. When you create the Stripe account, select **United States** as the business location.
2. Open the sandbox that you will use for the workshop.
3. In **Settings → Payment methods**, request **Stablecoins and Crypto**.
4. Wait until **Stablecoins and Crypto** shows **Active**. A **Pending** request is not sufficient.
5. Create a Stripe Profile in the same sandbox and copy its `profile_test_...` ID.
6. Copy the secret key for that sandbox.

The payment method, Profile ID, and secret key must all belong to the same sandbox. Creating a Profile or a crypto deposit address does not activate the **Stablecoins and Crypto** payment method by itself.

To complete a paid retry, you also need an x402 v2-compatible buyer funded with Base Sepolia test USDC. You will not implement the buyer in this project; you will implement only the seller-side `402` paywall.

Keep every payment component in test mode. Do not combine a test Stripe key with a live profile, live funds, or a mainnet facilitator.

## Step 1: configure the payment service

Copy the safe environment template. `.env` is ignored by Git:

```bash
cp .env.example .env
```

Generate the secret that `mppx` will use to bind payment challenges to your API:

```bash
openssl rand -base64 32
```

Put the result and your Stripe sandbox values in `.env`:

```env
MPP_AMOUNT=0.01
MPP_REALM=workshop-x402-api
MPP_SECRET_KEY=<paste-the-generated-secret>
STRIPE_LIVEMODE=false
STRIPE_PROFILE_ID=profile_test_...
STRIPE_SECRET_KEY=sk_test_...
X402_FACILITATOR_URL=https://x402.org/facilitator
```

`MPP_AMOUNT` is a decimal dollar amount: `0.01` means one cent. Keep it at or above `0.01` so Stripe can represent the resulting PaymentIntent amount. Use the public facilitator shown above only for supported test networks.

## Step 2: create the paywall handler

Create `src/mpp-handler.ts` with the following code:

```ts
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";
import { Mppx, stripe as stripeMpp } from "mppx/server";
import Stripe from "stripe";
import {
  apiGatewayEventToRequest,
  webResponseToApiGatewayResponse,
} from "./http-adapters";
import { jsonResponse } from "./handler";

type PaymentResult =
  | { status: 402; challenge: Response }
  | {
      status: 200;
      withReceipt: (response: Response) => Response;
    };

type PaymentHandler = (request: Request) => Promise<PaymentResult>;

let cachedPaymentHandler: Promise<PaymentHandler> | undefined;

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function getPaymentHandler(): Promise<PaymentHandler> {
  if (cachedPaymentHandler) {
    return cachedPaymentHandler;
  }

  cachedPaymentHandler = (async () => {
    const stripeClient = new Stripe(requiredEnv("STRIPE_SECRET_KEY"));

    const machinePayments = stripeMpp.create({
      client: stripeClient,
      depositAddresses: (network) =>
        stripeMpp.findOrCreateDepositAddress(stripeClient, network),
      livemode: process.env.STRIPE_LIVEMODE === "true",
      networkId: requiredEnv("STRIPE_PROFILE_ID"),
    });

    const recipient =
      await machinePayments.findOrCreateDepositAddress("base");

    const mppx = Mppx.create({
      methods: [
        machinePayments.base.charge({
          recipient,
          x402: {
            facilitator: requiredEnv("X402_FACILITATOR_URL"),
          },
        }),
      ],
      realm: process.env.MPP_REALM,
      secretKey: requiredEnv("MPP_SECRET_KEY"),
    });

    return mppx.evm.charge({
      amount: process.env.MPP_AMOUNT ?? "0.01",
      description: "Access the workshop content API",
      scope: "GET /content",
    });
  })();

  return cachedPaymentHandler;
}

function contentResponse(): Response {
  return Response.json({
    message: "Hello from an AWS Lambda API.",
    content: "This is generic workshop content.",
    version: "x402-enabled",
  });
}

export async function handler(
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyStructuredResultV2> {
  const method = event.requestContext.http.method;
  const path = event.rawPath;

  if (method !== "GET" || path !== "/content") {
    return jsonResponse(404, { error: "Not found" });
  }

  const request = apiGatewayEventToRequest(event);
  const charge = await getPaymentHandler();
  const payment = await charge(request);

  // No valid payment means no content.
  if (payment.status === 402) {
    return webResponseToApiGatewayResponse(payment.challenge);
  }

  // Payment succeeded, so you can return the content with its receipt.
  return webResponseToApiGatewayResponse(
    payment.withReceipt(contentResponse()),
  );
}
```

## Step 3: understand the payment boundary

The important part of your handler is deliberately small:

```ts
const payment = await charge(request);

if (payment.status === 402) {
  return webResponseToApiGatewayResponse(payment.challenge);
}

return webResponseToApiGatewayResponse(
  payment.withReceipt(contentResponse()),
);
```

You enforce two rules here:

1. When payment is absent or invalid, you return the SDK's challenge unchanged. It contains HTTP `402` and the `PAYMENT-REQUIRED` information the buyer needs.
2. You build the protected `200` response only after payment succeeds. `withReceipt(...)` adds the settlement receipt to your response.

The provided adapters preserve `PAYMENT-SIGNATURE` on the buyer's retry, `PAYMENT-REQUIRED` on the challenge, and `PAYMENT-RESPONSE` on success. You do not need to parse or recreate those headers.

You also cache the initialized payment handler outside the Lambda invocation path. Warm invocations can reuse the Stripe deposit address and `mppx` setup instead of rebuilding them for every request.

## Step 4: type-check the paywall

Run the starter tests and the dedicated paywall type-check:

```bash
npm test
npm run build:mpp
```

You can compare your implementation with `src/mpp-handler.solution.ts`. You can type-check that reference separately:

```bash
npm run build:mpp-solution
```

## Step 5: deploy the paid handler

Use the paid deployment commands:

```bash
npm run synth:mpp
npm run deploy:mpp
```

These commands load `.env`, set `MPP_ENABLED=true`, and switch Lambda from `src/handler.ts` to your `src/mpp-handler.ts` entry point.

Running the ordinary `npm run deploy` command selects the free handler again.

## Step 6: observe HTTP 402

Call the same endpoint that you deployed in Part 1:

```bash
curl -i "https://your-api-id.execute-api.your-aws-region.amazonaws.com/content"
```

Replace the example URL with the complete `ApiUrl` printed by CDK, followed by `/content`. The paid deployment updates the existing Lambda function, so the endpoint URL has not changed.

You should now receive:

```http
HTTP/2 402
payment-required: <base64-encoded-x402-requirements>
www-authenticate: Payment ...
```

This `402` is your product offer. It tells an x402-compatible client which network, asset, recipient, and amount it must pay. It is not proof of payment and must not include the protected content.

In sandbox mode, your challenge should describe Base Sepolia (`eip155:84532`), USDC, the Stripe-managed recipient address, and your configured amount.

## Step 7: make a paid request

Give your endpoint URL to an x402 v2-compatible client whose wallet has Base Sepolia test USDC. The client will:

1. call `GET /content` and receive your `402` challenge;
2. authorize the exact USDC payment described by `PAYMENT-REQUIRED`;
3. retry `GET /content` with `PAYMENT-SIGNATURE`;
4. receive HTTP `200`, your content, and `PAYMENT-RESPONSE`.

You can use Amazon Bedrock AgentCore Payments with a funded Privy-backed instrument as the buyer, but you do not need buyer-specific code in this repository.

After settlement, open Payments in the same Stripe sandbox used by `STRIPE_SECRET_KEY`. You should see the transaction as a crypto PaymentIntent. Receiving a `402` alone never creates a completed payment.

## Checkpoint

You have changed the endpoint from a free resource into a paid resource while preserving its URL and content contract:

```text
verify payment first -> return a challenge or the protected response
```

You must never return the protected value before verification and settlement succeed. A client-supplied signature, a `402` challenge, or a pending transaction is not a completed payment.

## Troubleshooting

### You still receive HTTP 200 with `version: starter`

You deployed the free handler. Run `npm run deploy:mpp`.

### Deployment says `src/mpp-handler.ts` is missing

Create the file from Step 2. If you want to deploy the instructor reference temporarily, run `npm run deploy:mpp-solution`.

### You receive HTTP 500

Check your Lambda logs in CloudWatch. Look for an empty environment value, a Stripe key/profile mismatch, unavailable deposit-address capability, an unsupported facilitator, or an `MPP_SECRET_KEY` shorter than 32 bytes.

### Your paid retry still returns HTTP 402

Check that your buyer preserved `PAYMENT-SIGNATURE`, owns enough USDC on the exact challenged network, and uses a facilitator that supports that network and asset.

### Your settled payment does not appear in Stripe

Confirm that **Stablecoins and Crypto** is **Active** under **Settings → Payment methods** in the same sandbox used by `STRIPE_SECRET_KEY`. Then make sure the Profile ID belongs to that sandbox, the amount is at least `$0.01`, and the facilitator returned a settlement transaction hash.

Check the Lambda logs in CloudWatch for `[stripe] failed to record crypto payment`. An error saying that payment method type `crypto` is invalid means **Stablecoins and Crypto** is not active for that sandbox. The on-chain settlement can succeed even when Stripe rejects the subsequent PaymentIntent creation, so do not treat wallet movement alone as proof that a PaymentIntent was recorded.

## Cleanup

Remove the deployed AWS resources:

```bash
npm run destroy
```
