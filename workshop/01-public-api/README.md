[← Project Overview](../../README.md) · [Workshop Overview](../../WORKSHOP.md) · [Next: Step 2: Add the HTTP 402 Paid API →](../02-paid-api/README.md)

# Step 1: Build and Deploy the Public API

## Goal

You will install, test, deploy, and call a working API without a paywall.

At the end of this part, the endpoint will behave like this:

```text
GET /content -> HTTP 200 + JSON content
```

This gives you a working control case before you add monetization in Step 2.

## Before you start

You need:

- Node.js 20 or newer
- an AWS account
- AWS credentials configured in your shell
- an AWS region in which you can deploy Lambda, API Gateway, and CloudWatch resources

## 0.1 Install the project

From the repository root, enter the seller API project and install its declared dependencies:

```bash
cd api
npm install
```

Run the remaining commands in this part from the `api/` directory.

## 0.2 Inspect the public handler

Open `src/handler.ts`. The `GET /content` route returns the content immediately:

```ts
if (method !== "GET" || path !== "/content") {
  return jsonResponse(404, { error: "Not found" });
}

return buildContentResponse();
```

There is no payment check, Stripe client, wallet, or payment secret in this request path.

The successful response is:

```json
{
  "message": "Hello from an AWS Lambda API.",
  "content": "This is generic workshop content.",
  "version": "starter"
}
```

## 0.3 Run the tests

Run:

```bash
npm test
```

The tests confirm that:

- `GET /content` returns HTTP `200` and the expected JSON;
- unsupported paths return HTTP `404`;
- unsupported methods return HTTP `404`;
- the HTTP adapters preserve headers and response status codes.

## 0.4 Validate the AWS stack

Synthesize the CloudFormation template:

```bash
npm run synth
```

The stack contains:

- one Node.js Lambda function;
- one API Gateway HTTP API route for `GET /content`;
- one CloudWatch log group;
- one `ApiUrl` stack output.

The free deployment passes only `CONTENT_VERSION=starter` to Lambda. It does not require payment configuration.

## 0.5 Deploy the public API

Bootstrap CDK once for each AWS account and region:

```bash
npx cdk bootstrap
```

Deploy the stack:

```bash
npm run deploy
```

CDK prints an `ApiUrl`. Copy that URL for the next step.

## 0.6 Call the endpoint

Send an unpaid request:

```bash
curl -i "https://your-api-id.execute-api.your-aws-region.amazonaws.com/content"
```

Replace the example URL with the complete `ApiUrl` printed by CDK, followed by `/content`.

You should receive:

```http
HTTP/2 200
content-type: application/json
```

```json
{
  "message": "Hello from an AWS Lambda API.",
  "content": "This is generic workshop content.",
  "version": "starter"
}
```

## Checkpoint

You now have a public API that returns useful content without a paywall. Keep its full URL: you will call the same URL after replacing the free handler with the paid handler.

Continue with **[Step 2: Add the HTTP 402 Paid API](../02-paid-api/README.md)**.
