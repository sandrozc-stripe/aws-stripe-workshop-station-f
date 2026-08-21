from strands.models.bedrock import BedrockModel


def load_model() -> BedrockModel:
    """Get Bedrock model client using IAM credentials."""
    # WORKSHOP: this is Amazon Nova Lite, which needs no extra setup. Claude models on
    # Bedrock additionally require your AWS account to submit a one-time "model use case"
    # form (Module 01) — if your account has already done that, swap the line below for:
    #   return BedrockModel(model_id="global.anthropic.claude-sonnet-4-5-20250929-v1:0")
    return BedrockModel(model_id="us.amazon.nova-lite-v1:0")
