# AWS Lambda x402 Paywall Workshop

This project is a hands-on workshop for building and monetizing a small API on AWS.

You begin with a public endpoint that returns JSON without authentication or payment:

```text
GET /content -> HTTP 200
```

You then place the same endpoint behind an x402 payment boundary:

```text
GET /content without payment -> HTTP 402 + PAYMENT-REQUIRED
GET /content with payment    -> HTTP 200 + PAYMENT-RESPONSE + content
```

The paid version uses `mppx` to produce and verify the x402 exchange, an x402 facilitator to settle Base USDC, and a Stripe-managed deposit address to record the successful payment.

## Project structure

```text
src/handler.ts                 Free API handler
src/http-adapters.ts           API Gateway/Web API adapters
src/mpp-handler.solution.ts    Completed paywall reference
lib/api-stack.ts               Lambda and API Gateway CDK stack
test/                          Starter API and adapter tests
docs/                          Sequential workshop instructions
```

The free and paid handlers are separate entry points. Running `npm run deploy` deploys the free API. Running `npm run deploy:mpp` deploys the paywall you create during the workshop.

## Technology

- TypeScript and Node.js 24 on AWS Lambda
- API Gateway HTTP API
- AWS CDK v2
- `mppx` with x402 v2
- Stripe machine payments
- Base Sepolia USDC for sandbox testing

## Workshop

Complete the guides in order:

1. [Part 1: Build and deploy the free API](docs/01-free-api.md)
2. [Part 2: Add the HTTP 402 paid API](docs/02-paid-api.md)
