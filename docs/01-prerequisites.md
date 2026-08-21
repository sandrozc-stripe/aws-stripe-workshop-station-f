# 01 — Prerequisites

Complete this checklist before Module 02. The first item has a ~15 minute propagation delay, so
submit it now and let it run in the background while you do everything else.

## 1. Submit the Bedrock model use-case form (do this first)

> **Concept: Bedrock model-access prerequisite**
>
> Some AWS accounts (especially fresh sandbox accounts) need to submit a one-time "model use
> case" form before they're allowed to call Anthropic Claude models on Bedrock. This is an
> account-level AWS requirement, unrelated to anything in this workshop's code — but if you skip
> it, you'll hit an error later that looks like it's about payments and isn't.

- [ ] In the AWS console, go to **Amazon Bedrock → Model access**.
- [ ] Find the Anthropic model use-case form and submit it if you haven't already.
- [ ] Approval usually takes about 15 minutes. You don't need to wait for it right now — the
      workshop defaults to a model that doesn't need this (see below) — but submit it now so it's
      ready if you want to switch to Claude later.

If you'd rather not wait at all, that's fine: this workshop's agent defaults to **Amazon Nova
Lite**, which needs no form. You can switch to Claude any time later by editing one line in
`app/PaymentsAgent/model/load.py` (Module 04 shows you exactly where).

## 2. Accounts

- [ ] **AWS account** with console access and an IAM user or role you can get access keys for.
- [ ] **Privy account** — sign up free at [privy.io](https://privy.io) (or use one provided by the
      workshop organizers).

## 3. CLI tools

- [ ] **Node.js 20+** — `node --version`
- [ ] **AWS CLI**, configured with credentials — `aws sts get-caller-identity` should return your
      account details.
- [ ] **Python 3.10+** and **uv** — [install uv](https://docs.astral.sh/uv/getting-started/installation/)
      if you don't have it: `uv --version`
- [ ] **pnpm** — `pnpm --version` (used for the frontend in Module 06)
- [ ] **AgentCore CLI**:
  ```bash
  npm install -g @aws/agentcore
  agentcore --version   # need v0.20.0+ for payments support
  ```

## 4. Clone this repo

```bash
git clone <this-repo-url>
cd <this-repo>
```

Everything below assumes you're working from the repo root.

## What's next

Continue to [**02-aws-payments-setup.md**](02-aws-payments-setup.md) to create your Payment
Manager in the AWS console.
