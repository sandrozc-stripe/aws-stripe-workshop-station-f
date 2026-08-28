[← Step 3 — Provision the wallet](../03-provision-wallet/README.md) · [Workshop overview](../../WORKSHOP.md) · [Next: Step 5 — Fund the wallet →](../05-fund-wallet/README.md)

# Step 4 — Delegate signing rights via the frontend

**Goal of this step:** have the end user log in and explicitly grant the agent's authorization
key signing rights on their wallet.

This is the step that can't be automated away, by design. The wallet belongs to the end user (see
[Concepts — who owns what](../00-concepts/README.md#who-owns-what)), so only that user — logged in
as themselves — can approve adding a new signer. If this step is skipped, `ProcessPayment` will
fail later with a "Delegation not completed" error; there's no API AgentCore or this workshop can
call to force it through.

We use the reference frontend from the
[Privy AgentCore SDK](https://github.com/privy-io/aws-agentcore-sdk) — vendored into this repo
under `privy-frontend/` — which provides a small wallet hub for login, agent delegation, and
funding.

## 4.1 Configure the frontend

```bash
cd privy-frontend
cp .env.example .env
```

Edit `privy-frontend/.env`:

- `NEXT_PUBLIC_PRIVY_SIGNER_ID` → the `PRIVY_KEY_ID` from [Step 1](../01-privy-app-setup/README.md).
- `PRIVY_APP_SECRET` → the same value from Step 1.

## 4.2 Run the app and log in

Start the app (`npm run dev`, or whatever the frontend's README specifies), then log in using the
same `END_USER_EMAIL` you defined in [Step 3](../03-provision-wallet/README.md) — the wallet is
linked to that email, so logging in with any other address won't show it.

<p align="center">
  <img src="images/1_run_app.png" width="640" alt="Privy frontend: running application landing page">
</p>

<p align="center"><em>Enter the end-user email to start the login flow.</em></p>

<p align="center">
  <img src="images/2_enter_user_email.png" width="640" alt="Privy frontend: email login form">
</p>

Once logged in, you land on the wallet dashboard.

<p align="center">
  <img src="images/3_access_dashboad.png" width="640" alt="Privy frontend: wallet dashboard after login">
</p>

## 4.3 Grant the agent access

Click **Connect Agent**. This is the moment the user authorizes the agent's authorization key
(from Step 1) as a signer on their embedded wallet — everything downstream depends on this click.

<p align="center">
  <img src="images/4_give_access_to_agent.png" width="640" alt="Privy frontend: Connect Agent button and delegation prompt">
</p>

A success state confirms the delegation went through.

<p align="center">
  <img src="images/5_success_giving_access.png" width="640" alt="Privy frontend: delegation success confirmation">
</p>

The agent is now an **authorized signer** — not an owner. The user retains full control and can
revoke this access from the same dashboard at any time.

---

Continue to **[Step 5 — Fund the wallet on testnet](../05-fund-wallet/README.md)**.
