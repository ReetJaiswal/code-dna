from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Reads values from environment variables / the .env file."""
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    anthropic_api_key: str = ""
    llm_model: str = "claude-sonnet-5-5"
    embedding_model: str = "all-MiniLM-L6-v2"
    data_dir: str = "./data"
    top_k: int = 5                 # how many similar chunks to fetch
    max_graph_chunks: int = 5      # how many connected chunks to add


settings = Settings()
