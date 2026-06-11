from app.models import FormBarContext, FormSummary, GeneratedLick, StoredLick
from app.services.supabase_client import get_supabase_client


def list_forms() -> list[FormSummary]:
    supabase = get_supabase_client()
    response = (
        supabase.table("forms")
        .select("id,slug,name,key_root,bar_count,time_signature,description,is_active,created_at")
        .eq("is_active", True)
        .order("created_at")
        .execute()
    )
    return [FormSummary.model_validate(row) for row in (response.data or [])]


def list_form_bars(form_id: str) -> list[FormBarContext]:
    supabase = get_supabase_client()
    response = (
        supabase.table("form_bars")
        .select("id,form_id,bar_index,degree,chord_symbol,chord_root,created_at")
        .eq("form_id", form_id)
        .order("bar_index")
        .execute()
    )
    return [FormBarContext.model_validate(row) for row in (response.data or [])]


def list_licks(
    *,
    form_id: str | None,
    bar_index: int | None,
    note_policy: str | None,
    limit: int,
) -> list[StoredLick]:
    supabase = get_supabase_client()
    query = (
        supabase.table("licks")
        .select(
            "id,form_id,bar_index,note_policy,source,tempo,difficulty_level,is_active,created_at,notes_json"
        )
        .eq("is_active", True)
        .order("created_at", desc=True)
        .limit(limit)
    )
    if form_id is not None:
        query = query.eq("form_id", form_id)
    if bar_index is not None:
        query = query.eq("bar_index", bar_index)
    if note_policy is not None:
        query = query.eq("note_policy", note_policy)

    response = query.execute()
    rows = response.data or []
    result: list[StoredLick] = []
    for row in rows:
        generated = GeneratedLick.model_validate(row["notes_json"])
        payload = {**row, "generated": generated}
        result.append(StoredLick.model_validate(payload))
    return result

