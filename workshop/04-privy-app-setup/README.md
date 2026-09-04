[← Step 3: Understand AgentCore Payments and Privy](../03-concepts/README.md) · [Workshop Overview](../../WORKSHOP.md) · [Next: Step 5: Create an AgentCore Payment Manager + Connector →](../05-agentcore-payment-manager/README.md)

# Step 4: Create your Privy app & authorization key

**Goal of this step:** end up with four values (`PRIVY_APP_ID`, `PRIVY_APP_SECRET`,
`PRIVY_KEY_ID`, and `PRIVY_PRIVATE_KEY`) saved in your root `.env`. AgentCore needs all four to
create the payment connector in Step 5.

Privy is where the actual wallet infrastructure lives. AWS never talks to Privy's dashboard or SDK
directly; it authenticates using the credentials you generate here.

## 3.1 Create your `.env` file first

Copy `.env.example` to `.env` at the repo root now, before you start clicking through Privy. That
way every credential below has somewhere to land the moment you copy it, instead of piling up in
scratch notes.

```bash
cp .env.example .env
```

You're about to fill in four values as you go through this step:

```
PRIVY_APP_ID=...
PRIVY_APP_SECRET=...
PRIVY_KEY_ID=...
PRIVY_PRIVATE_KEY=...        # wallet-auth: prefix stripped
```

Treat these like passwords: they belong only in `.env` (which is git-ignored), never committed,
pasted into chat, or hardcoded in agent source.

## 3.2 Create a dedicated Privy app

Sign up at the [Privy dashboard](https://dashboard.privy.io/) and create a new app. Use a
**dedicated** app for this workshop rather than reusing one that serves another product; it keeps
credential scope (and any later auditing) clean.

<p align="center">
  <img src="images/1_create_app.png" width="640" alt="Privy dashboard: Create app dialog with app name and platform selection">
</p>

<p align="center"><em>Give it a name and leave the platform as "Web": this app only needs to issue API credentials, not render Privy's login UI itself.</em></p>

Once created, Privy shows your keys exactly once.

<p align="center">
  <img src="images/2_create_app.png" width="640" alt="Privy dashboard: newly created app confirmation">
</p>

## 3.3 Retrieve your API keys

From the app's **API keys** page, copy the **App ID** and **App secret** straight into `.env` as
`PRIVY_APP_ID` and `PRIVY_APP_SECRET`.

<p align="center">
  <img src="images/3_api_keys.png" width="640" alt="Privy dashboard: API keys page showing App ID and App secret with copy buttons">
</p>

> **Save the App secret now.** Privy does not store it after creation. If you lose it, you'll
> need to reset it and update every place it's referenced.

## 3.4 Generate a Privy authorization key

Payments need a second, separate credential: a **signer key** that AgentCore uses to sign wallet
operations on the agent's behalf. This is not the same thing as your API keys above: API keys
authenticate *calls to Privy's API*, while the authorization key is what actually authorizes
*wallet signatures*.

In your Privy app, go to **Wallet Infrastructure → Keys and quorums**.

<p align="center">
  <img src="images/4_keys_and_quorums.png" width="640" alt="Privy dashboard: Wallet Infrastructure > Keys and quorums page">
</p>

Click **New Key** to generate a P-256 key pair.

<p align="center">
  <img src="images/5_create_key.png" width="640" alt="Privy dashboard: New Key creation dialog">
</p>

## 3.5 Note the Authorization ID and private key

Once created, Privy shows the key's credentials: the **Authorization ID** (this is your
`PRIVY_KEY_ID`) and the **private key** (this becomes your `PRIVY_PRIVATE_KEY`, after one edit;
see the warning below). Copy both into `.env` to finish this step.

<p align="center">
  <img src="images/6_key_credentials.png" width="640" alt="Privy dashboard: Authorization ID and private key credentials">
</p>

> **Gotcha: strip the `wallet-auth:` prefix.** Privy prefixes the generated private key with
> `wallet-auth:`. AgentCore Payments does **not** accept this prefix. Store only the raw base64
> content that follows it.
>
> ```
> Privy gives you:  wallet-auth:MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg...
> Store only:                   MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg...
> ```

---

Continue to **[Step 5: Create an AgentCore Payment Manager + Connector](../05-agentcore-payment-manager/README.md)**.
