# Part 1: Build and Deploy the Free API

## Goal

You will install, test, deploy, and call a working API without a paywall.

At the end of this part, the endpoint will behave like this:

```text
GET /content -> HTTP 200 + JSON content
```

This gives you a working control case before you add monetization in Part 2.

## Before you start

You need:

- Node.js 20 or newer
- an AWS account
- AWS credentials configured in your shell
- an AWS region in which you can deploy Lambda, API Gateway, and CloudWatch resources

## Step 1: install the project

Install the declared dependencies:

```bash
npm install
```

## Step 2: inspect the free handler

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

## Step 3: run the tests

Run:

```bash
npm test
```

The tests confirm that:

- `GET /content` returns HTTP `200` and the expected JSON;
- unsupported paths return HTTP `404`;
- unsupported methods return HTTP `404`;
- the HTTP adapters preserve headers and response status codes.

## Step 4: validate the AWS stack

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

## Step 5: deploy the free API

Bootstrap CDK once for each AWS account and region:

```bash
npx cdk bootstrap
```

Deploy the stack:

```bash
npm run deploy
```

CDK prints an `ApiUrl`. Copy that URL for the next step.

## Step 6: call the endpoint

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

Continue with [Part 2: Add the HTTP 402 paid API](02-paid-api.md).
