# 08 — Troubleshooting

Consolidated symptom → cause → fix for every gotcha referenced elsewhere in this guide.

---

### `ResourceNotFoundException: Model use case details have not been submitted for this account`

**Where you'll see it:** [Module 07](07-run-and-test-the-agent.md), when `agentcore dev` calls the
model.

**Cause:** Your AWS account hasn't submitted the one-time Anthropic model use-case form
([Module 01](01-prerequisites.md)) — required for Claude models on Bedrock, not for the payments
flow itself.

**Fix:** Either submit the form in the AWS console (**Bedrock → Model access**) and wait ~15
minutes, or switch `app/PaymentsAgent/model/load.py` back to
`BedrockModel(model_id="us.amazon.nova-lite-v1:0")`, which needs no form.

---

### "No wallets found" when clicking "Give access" in the Privy frontend

**Where you'll see it:** [Module 06](06-frontend-delegation-and-funding.md), the delegation step.

**Cause:** The wallet created by `setup_payment_user.py` ([Module 05](05-provision-wallet-and-session.md))
is linked to a specific email. If you log into the Privy frontend with a *different* email (or an
already-cached browser session for a different user), Privy shows an empty wallet list for that
session — there's nothing to delegate.

**Fix:** Log out of the frontend and log back in with the exact email you passed as `--email` to
`setup_payment_user.py`. If you need to use a different email, re-run the script with
`--email <new-email>` to provision a fresh wallet under that address, then update
`agentcore/.env.local` with the new instrument/session IDs it prints.

---

### Privy dashboard shows $0 balance / "no transactions" after funding

**Where you'll see it:** [Module 06](06-frontend-delegation-and-funding.md), right after using the
Circle faucet.

**Cause:** Privy's dashboard balance and activity indexer is tuned for mainnet activity and often
doesn't reflect testnet transfers promptly, or at all. This is a display limitation, not a sign
that funding failed.

**Fix:** Verify on a testnet block explorer instead — for Base Sepolia, search your wallet address
on [BaseScan](https://sepolia.basescan.org/). If the transfer shows there, the wallet is genuinely
funded.

---

### `AccessDeniedException` on `GetPaymentInstrument` (or `ProcessPayment`)

**Where you'll see it:** [Module 07](07-run-and-test-the-agent.md), when the agent tries to pay —
even though the Payment Manager ARN, instrument ID, and session ID all look correct.

**Cause:** `agentcore dev` calls AWS using boto3's **default credential chain**, not necessarily
the credentials you have in mind. If your machine has a default AWS CLI profile configured for a
*different* account or user than the one that owns your Payment Manager
([Module 02](02-aws-payments-setup.md)'s "inbound auth / IAM identity" concept), payment API calls
get rejected — the ARN can be perfectly correct and still fail, because the *caller identity* is
wrong.

**Fix:** Confirm which identity you intend to use:

```bash
aws sts get-caller-identity
```

Then make sure `agentcore/.env.local` explicitly sets `AWS_ACCESS_KEY_ID` and
`AWS_SECRET_ACCESS_KEY` for that identity (see [Module 05](05-provision-wallet-and-session.md)) —
don't rely on ambient/default AWS credentials for the dev server. Restart `agentcore dev` after
changing `.env.local` so it picks up the new values.

---

### General debugging tips

- The dev server's full logs are written under `agentcore/.cli/logs/dev/dev-<timestamp>.log` —
  the exact path is printed when you run `agentcore dev`.
- `grep -i "payment\|402"` on that log file shows the full payment sequence (or exactly where it
  stopped).
- A direct boto3 call is a good way to isolate "is this an IAM problem or a code problem":
  ```bash
  python -c "import boto3; print(boto3.client('bedrock-agentcore', region_name='<region>').get_payment_instrument(paymentManagerArn='<arn>', paymentInstrumentId='<id>', userId='<user>'))"
  ```
  If this works with explicit credentials but the agent still fails, the problem is which
  identity `agentcore dev` is using — see the `AccessDeniedException` entry above.
