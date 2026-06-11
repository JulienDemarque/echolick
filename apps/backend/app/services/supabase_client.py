import os
from functools import lru_cache

from supabase import Client, create_client


def _resolve_supabase_key() -> str | None:
    # Supabase dashboard now emphasizes secret API keys.
    # Keep legacy aliases for compatibility across environments.
    return (
        os.getenv("SUPABASE_API_KEY")
        or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        or os.getenv("SUPABASE_KEY")
    )


@lru_cache(maxsize=1)
def get_supabase_client() -> Client:
    url = os.getenv("SUPABASE_URL")
    key = _resolve_supabase_key()

    if not url:
        raise RuntimeError("SUPABASE_URL is not set")
    if not key:
        raise RuntimeError(
            "SUPABASE_API_KEY (or SUPABASE_SERVICE_ROLE_KEY / SUPABASE_KEY) is not set"
        )

    return create_client(url, key)

