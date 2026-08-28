[← Step 5 — Fund the wallet](../05-fund-wallet/README.md) · [Workshop overview](../../WORKSHOP.md) · [Next: Step 7 — Run and test the agent →](../07-run-and-test-agent/README.md)

# Step 6 — Create a payment session

**Goal of this step:** create a **PaymentSession** — a time-boxed, spend-capped context the agent
will operate under in Step 7.

## Why sessions exist

AgentCore enforces spending at the session level, not per-recipient. Every `PaymentSession` has:

| Field | What it does |
|---|---|
| `maxSpendAmount` + `currency` | A hard ceiling for the session. Once reached, AgentCore denies further `ProcessPayment` calls *before* attempting to sign — no partial payments. |
| `expiryTimeInMinutes` | The session's lifetime. Once expired, it's dead even if budget remains. |

This is the governance mechanism AWS designed specifically for autonomous agents: because nothing
in an agent loop is guaranteed to stop calling a paid endpoint on its own, the budget has to live
outside the agent's control, enforced server-side by AgentCore. If a payment's signing step fails
*after* budget was provisionally deducted, AgentCore does not charge the session for the failed
attempt.

In production, prefer short-lived sessions (an hour or less) created fresh per user interaction,
rather than one long-lived session reused across many conversations — it keeps the blast radius of
a misbehaving agent small. This workshop uses a longer window purely for convenience while you're
testing.

## Run the script

```bash
uv run main/2_create_payment_session.py
```

[`main/2_create_payment_session.py`](../../main/2_create_payment_session.py) calls AgentCore's
`create_payment_session` API against the `PAYMENT_MANAGER_ARN` and `PAYMENT_USER_ID` from your
`.env`, requesting a 180-minute session capped at $5.00 USD.

It prints the session ID — copy it into `.env`:

```
Session ID: payment-session-xxx
```

Your `.env` should now have every value the agent needs at runtime: `PAYMENT_MANAGER_ARN`,
`PAYMENT_USER_ID`, `PAYMENT_INSTRUMENT_ID`, and `PAYMENT_SESSION_ID`.

---

Continue to **[Step 7 — Run and test the agent](../07-run-and-test-agent/README.md)**.
