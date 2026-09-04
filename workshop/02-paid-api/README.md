[← Step 1: Build and Deploy the Public API](../01-public-api/README.md) · [Workshop Overview](../../WORKSHOP.md) · [Next: Step 3: Understand AgentCore Payments and Privy →](../03-concepts/README.md)

# Step 2: Add the HTTP 402 Paid API

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

Complete [Step 1](../01-public-api/README.md) first so that you have a deployed public API and its
full URL. Run all commands in this step from the `api/` directory you entered in Step 1.

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

You will build an x402-compatible buyer funded with Base Sepolia test USDC in the next phase of
this workshop. For now, focus on the seller-side `402` paywall.

Keep every payment component in test mode. Do not combine a test Stripe key with a live profile, live funds, or a mainnet facilitator.

## 1.1 Configure the payment service

There is only one `.env` for the whole workshop, at the repository root, and every component
(this API, the provisioning scripts, and the agent) reads that same file. If you haven't created
it yet, copy the safe environment template now. `.env` is ignored by Git:

```bash
cp ../.env.example ../.env
```

Generate the secret that `mppx` will use to bind payment challenges to your API:

```bash
openssl rand -base64 32
```

Open the root `.env` (`../.env` from here) and fill in the **Step 2** block with the result and
your Stripe sandbox values:

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

You'll come back to this same root `.env` in every later step of the workshop — the buyer-agent
phase adds its own values further down the file, but there's never a second copy of this file to
keep in sync.

## 1.2 Create the paywall handler

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

## 1.3 Understand the payment boundary

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

## 1.4 Type-check the paywall

Run the starter tests and the dedicated paywall type-check:

```bash
npm test
npm run build:mpp
```

You can compare your implementation with `src/mpp-handler.solution.ts`. You can type-check that reference separately:

```bash
npm run build:mpp-solution
```

## 1.5 Deploy the paid handler

Use the paid deployment commands:

```bash
npm run synth:mpp
npm run deploy:mpp
```

These commands load `.env`, set `MPP_ENABLED=true`, and switch Lambda from `src/handler.ts` to your `src/mpp-handler.ts` entry point.

Running the ordinary `npm run deploy` command selects the free handler again.

## 1.6 Observe HTTP 402

Call the same endpoint that you deployed in Step 1:

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

Create the file from section 1.2. If you want to deploy the instructor reference temporarily,
run `npm run deploy:mpp-solution`.

### You receive HTTP 500

Check your Lambda logs in CloudWatch. Look for an empty environment value, a Stripe key/profile mismatch, unavailable deposit-address capability, an unsupported facilitator, or an `MPP_SECRET_KEY` shorter than 32 bytes.

### Your paid retry still returns HTTP 402

Check that your buyer preserved `PAYMENT-SIGNATURE`, owns enough USDC on the exact challenged network, and uses a facilitator that supports that network and asset.

### Your settled payment does not appear in Stripe

Confirm that **Stablecoins and Crypto** is **Active** under **Settings → Payment methods** in the same sandbox used by `STRIPE_SECRET_KEY`. Then make sure the Profile ID belongs to that sandbox, the amount is at least `$0.01`, and the facilitator returned a settlement transaction hash.

Check the Lambda logs in CloudWatch for `[stripe] failed to record crypto payment`. An error saying that payment method type `crypto` is invalid means **Stablecoins and Crypto** is not active for that sandbox. The on-chain settlement can succeed even when Stripe rejects the subsequent PaymentIntent creation, so do not treat wallet movement alone as proof that a PaymentIntent was recorded.

## Next: understand the paying agent

Keep the paid API deployed and save its full `/content` URL. In the next phase, you will build the
Amazon Bedrock AgentCore buyer that funds a wallet, receives this API's x402 challenge, settles
the payment, and retries the request with proof of payment.

Return to the repository root before continuing:

```bash
cd ..
```

Continue with **[Step 3: Understand AgentCore Payments and Privy](../03-concepts/README.md)**.
