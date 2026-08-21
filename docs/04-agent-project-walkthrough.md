# 04 — Agent Project Walkthrough

Before wiring in real credentials, take five minutes to see how the agent is put together. You
won't change any logic in this repo — just fill in a few values at clearly marked spots.

## Where things live

```
app/PaymentsAgent/
├── main.py              <- agent entrypoint (this module's focus)
├── model/load.py         <- which Bedrock model the agent uses
├── mcp_client/client.py  <- example MCP tool client (not payments-related)
└── scripts/
    └── setup_payment_user.py  <- provisions your wallet (Module 05 runs this)
```

## `main.py` — the payments wiring

Open `app/PaymentsAgent/main.py`. Two things matter for this workshop:

**1. The Payments plugin config**, near the top:

```python
_payments_config = AgentCorePaymentsPluginConfig(
    payment_manager_arn=os.environ["PAYMENT_MANAGER_ARN"],
    user_id=os.environ["PAYMENT_USER_ID"],
    payment_instrument_id=os.environ["PAYMENT_INSTRUMENT_ID"],
    payment_session_id=os.environ["PAYMENT_SESSION_ID"],
    region=os.environ.get("AWS_REGION", "us-east-1"),
)
payments_plugin = AgentCorePaymentsPlugin(config=_payments_config)
```

Look for the `# WORKSHOP:` comments right above this block — they're already in the file, and
they tell you exactly where each environment variable comes from (short version: all five come
from `agentcore/.env.local`, which you'll fill in during Module 05).

**2. Where the plugin gets attached to the agent**, further down inside `get_or_create_agent`:

```python
cache[session_id] = Agent(
    model=load_model(),
    system_prompt=DEFAULT_SYSTEM_PROMPT,
    tools=tools,
    conversation_manager=_make_conversation_manager(),
    hooks=[],
    plugins=[payments_plugin],   # <- this is what makes payments automatic
)
```

That's it — there's no special "pay for this" tool the model has to call. The plugin transparently
intercepts *any* tool call (in this case, the stock `http_request` tool from `strands_tools`,
included in `tools = [http_request]` near the top of the file) and handles the 402 → pay → retry
sequence for you.

Everything else in `main.py` (`strip_trailing_tool_use`, `_extract_prompt`, the session cache in
`agent_factory`) is standard AgentCore/Strands scaffolding unrelated to payments — safe to ignore
for this workshop.

## `model/load.py` — which model the agent uses

```python
def load_model() -> BedrockModel:
    """Get Bedrock model client using IAM credentials."""
    return BedrockModel(model_id="us.amazon.nova-lite-v1:0")
```

This ships pointed at **Amazon Nova Lite**, which needs no extra AWS setup. There's a
`# WORKSHOP:` comment right above the `return` line with the exact Claude model ID to swap in if
your AWS account already completed the Bedrock model-access form from Module 01.

## `scripts/setup_payment_user.py` — don't edit, just run

You'll run this in Module 05, not edit it. It's worth knowing what it does: it creates one
**payment instrument** (a wallet, linked to an email) and one **payment session** (a budget-capped
spending window) against the Payment Manager/connector you created in Module 02, then prints the
exact environment variables you need to paste into `agentcore/.env.local`.

There's a `# WORKSHOP:` comment above its `--manager-arn`/`--connector-id` arguments explaining
why you need to pass those two explicitly for this workshop (short version: this workshop's
Payment Manager was created by hand in the AWS console rather than via the AgentCore CLI, so
there's no local deployed-state file for the script to auto-read them from).

## What's next

Continue to [**05-provision-wallet-and-session.md**](05-provision-wallet-and-session.md) to
actually run that script and fill in your `.env.local`.
