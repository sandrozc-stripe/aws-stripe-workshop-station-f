[← Step 5: Create an AgentCore Payment Manager + Connector](../05-agentcore-payment-manager/README.md) · [Workshop Overview](../README.md) · [Next: Step 7: Delegate Signing Rights via the Frontend →](../07-delegate-signing/README.md)

# Step 6: Provision the agent's wallet

**Goal of this step:** create the **PaymentInstrument** (the end user's embedded wallet) and
confirm it exists in Privy.

A new instrument starts with **0 USDC** and the agent has **no permission to spend from it yet**.
This step only creates the wallet; funding (Step 8) and delegating signing rights (Step 7) come
after.

## 5.1 Collect the Payment Manager ARN and Connector ID

Back in the AWS console, open the Payment Manager you created in Step 5 and copy its ARN.

<p align="center">
  <img src="images/1_get_payment_manager_arn.png" width="760" alt="AWS console: Payment Manager detail page showing the ARN">
</p>

Then open the connector you created alongside it.

<p align="center">
  <img src="images/2_goto_connector.png" width="760" alt="AWS console: navigating to the payment connector detail page">
</p>

Copy its Connector ID as well.

<p align="center">
  <img src="images/3_get_connector_id.png" width="760" alt="AWS console: connector detail page showing the Connector ID">
</p>

## 5.2 Fill in `.env`

Define an `END_USER_EMAIL`: this is the email address of the person who will own the wallet and
approve delegation in Step 7. Add it, along with the ARN and Connector ID above, to your root
`.env`:

```
PAYMENT_MANAGER_ARN=arn:aws:bedrock-agentcore:...
CONNECTOR_ID=...
END_USER_EMAIL=you@example.com
PAYMENT_USER_ID=agentcore-user
AWS_REGION=us-east-1
AWS_ACCESS_KEY=...
AWS_SECRET_KEY=...
```

`AWS_ACCESS_KEY` / `AWS_SECRET_KEY` should belong to an IAM principal with permission to call the
AgentCore Payments data-plane APIs (`CreatePaymentInstrument`, `CreatePaymentSession`,
`ProcessPayment`), the same credentials referenced throughout this workshop's root `.env`.

## 5.3 Create the wallet

Run the provisioning script from the repo root:

```bash
uv run main/1_create_payment_instrument_wallet.py
```

The repo root's [`pyproject.toml`](../../pyproject.toml) declares the two dependencies this
script needs (`boto3`, `python-dotenv`). The first time you run `uv run` here, `uv` creates a
`.venv` and installs them automatically; you don't need to `pip install` anything by hand.

This script ([`main/1_create_payment_instrument_wallet.py`](../../main/1_create_payment_instrument_wallet.py))
calls AgentCore's `create_payment_instrument` API directly via `boto3`, requesting an
`EMBEDDED_CRYPTO_WALLET` on the `ETHEREUM` network family (which covers both Base and Base
Sepolia) and linking it to `END_USER_EMAIL`. Note that this creates the wallet **through
AgentCore**, not through Privy's SDK: AgentCore provisions the underlying Privy embedded wallet
for you and hands back its address.

It prints two values; copy both into `.env`:

```
Payment Instrument ID: payment-instrument-xxxx
Wallet Address: 0x123...
```

## 5.4 Verify the wallet exists in Privy

Head back to the [Privy dashboard](https://dashboard.privy.io/) and confirm the embedded wallet
was created for the agent's linked account.

<p align="center">
  <img src="images/4_check_that_embedded_wallet_created.png" width="760" alt="Privy dashboard: embedded wallet listed for the linked end-user email">
</p>

At this point the wallet exists and holds 0 USDC, but the agent still cannot spend from it. That
requires the end user's explicit delegation, which is Step 7.

---

Continue to **[Step 7: Delegate Signing Rights via the Frontend](../07-delegate-signing/README.md)**.
