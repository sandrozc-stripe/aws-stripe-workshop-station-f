[← Step 4: Delegate signing](../04-delegate-signing/README.md) · [Workshop overview](../../WORKSHOP.md) · [Next: Step 6: Create a payment session →](../06-payment-session/README.md)

# Step 5: Fund the wallet on testnet

**Goal of this step:** put testnet USDC into the wallet so there's something for the agent to
spend in Step 7.

This workshop runs entirely on **Base Sepolia**, a public Ethereum L2 testnet. Nothing here moves
real money; see [supported networks](../08-reference/README.md#supported-networks) in the
reference section for the mainnet equivalents if you later move this into production.

## 5.1 Get testnet USDC from Circle's faucet

Go to [Circle's USDC faucet](https://faucet.circle.com/), select **Base Sepolia**, and paste in
the wallet address from [Step 3](../03-provision-wallet/README.md) (the same address visible on
the Privy dashboard from Step 4).

<p align="center">
  <img src="images/1_goto_testnet_faucet.png" width="640" alt="Circle faucet: network and token selection">
</p>

Request funds; the faucet drips a small, fixed amount of free testnet USDC.

<p align="center">
  <img src="images/2_fund_wallet.png" width="640" alt="Circle faucet: entering the wallet address to fund">
</p>

<p align="center">
  <img src="images/3_tokens_sent.png" width="640" alt="Circle faucet: confirmation that tokens were sent">
</p>

## 5.2 Verify the transfer on-chain

Open [Base Sepolia's block explorer](https://sepolia.basescan.org/) and search for the wallet
address.

<p align="center">
  <img src="images/4_goto_basescan.png" width="640" alt="Basescan: searching for the wallet address">
</p>

Confirm the USDC balance reflects the faucet transfer before moving on. If it's still zero, wait
a few seconds and refresh; Base Sepolia confirmations are typically fast but not instant.

<p align="center">
  <img src="images/5_check_funds_are_here.png" width="640" alt="Basescan: wallet address showing the received USDC balance">
</p>

---

Continue to **[Step 6: Create a payment session](../06-payment-session/README.md)**.
