from anthropic import Anthropic

from app.config import settings

_client: Anthropic | None = None


def generate(system: str, user: str) -> str:
    """Step 10: ask the LLM to write the answer."""
    global _client
    if _client is None:
        _client = Anthropic(api_key=settings.anthropic_api_key)
    msg = _client.messages.create(
        model=settings.llm_model,
        max_tokens=1024,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    return "".join(b.text for b in msg.content if b.type == "text")
