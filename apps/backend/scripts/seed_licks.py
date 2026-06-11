import argparse
import json
import sys
from pathlib import Path
from typing import Literal

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.append(str(ROOT))

from app.models import GenerateLickRequest, GeneratedLick  # noqa: E402
from app.services.generator import generate_lick  # noqa: E402
from app.services.supabase_client import get_supabase_client  # noqa: E402

PolicyName = Literal["major_penta_root", "minor_penta_root", "mix_major_minor", "chord_tones_plus_passing"]

DEFAULT_POLICIES: list[PolicyName] = [
    "major_penta_root",
    "minor_penta_root",
    "mix_major_minor",
]


def _flavor_for_policy(policy: PolicyName) -> Literal["major", "minor"]:
    if policy == "minor_penta_root":
        return "minor"
    return "major"


def _difficulty_for_policy(policy: PolicyName) -> int:
    if policy in ("major_penta_root", "minor_penta_root"):
        return 1
    if policy == "chord_tones_plus_passing":
        return 2
    return 3


def _fetch_active_forms() -> list[dict]:
    supabase = get_supabase_client()
    response = supabase.table("forms").select("id,slug,key_root,is_active").eq("is_active", True).execute()
    return response.data or []


def _fetch_form_bars(form_id: str) -> list[dict]:
    supabase = get_supabase_client()
    response = (
        supabase.table("form_bars")
        .select("bar_index,degree,chord_symbol")
        .eq("form_id", form_id)
        .order("bar_index")
        .execute()
    )
    return response.data or []


def _delete_existing_seed_rows(form_id: str, source: str) -> int:
    supabase = get_supabase_client()
    response = supabase.table("licks").delete().eq("form_id", form_id).eq("source", source).execute()
    return len(response.data or [])


def _insert_seed_lick(
    form_id: str,
    bar_index: int,
    note_policy: PolicyName,
    source: str,
    generated: GeneratedLick,
) -> None:
    supabase = get_supabase_client()
    payload = {
        "form_id": form_id,
        "bar_index": bar_index,
        "note_policy": note_policy,
        "source": source,
        "tempo": generated.tempo,
        "notes_json": generated.model_dump(mode="json"),
        "difficulty_level": _difficulty_for_policy(note_policy),
        "is_active": True,
    }
    supabase.table("licks").insert(payload).execute()


def run_seed(*, source: str, tempo: int, clear_existing: bool, policies: list[PolicyName]) -> None:
    forms = _fetch_active_forms()
    if not forms:
        print("No active forms found. Run form seed SQL first.")
        return

    inserted = 0
    deleted = 0

    for form in forms:
        form_id = form["id"]
        form_slug = form["slug"]
        form_key = form.get("key_root", "A")
        bars = _fetch_form_bars(form_id)
        if not bars:
            print(f"Skipping {form_slug}: no bars found.")
            continue

        if clear_existing:
            deleted += _delete_existing_seed_rows(form_id, source)

        for bar in bars:
            degree = bar["degree"]
            chord = bar["chord_symbol"]
            bar_index = bar["bar_index"]

            for policy in policies:
                payload = GenerateLickRequest(
                    key=form_key,
                    degree=degree,
                    chord=chord,
                    flavor=_flavor_for_policy(policy),
                    tempo=tempo,
                )
                generated = generate_lick(payload)
                _insert_seed_lick(
                    form_id=form_id,
                    bar_index=bar_index,
                    note_policy=policy,
                    source=source,
                    generated=generated,
                )
                inserted += 1

        print(f"Seeded {form_slug}: {len(bars) * len(policies)} licks")

    print(
        json.dumps(
            {
                "seed_source": source,
                "forms": len(forms),
                "policies": policies,
                "tempo": tempo,
                "deleted_existing": deleted,
                "inserted": inserted,
            }
        )
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed Supabase licks from active forms.")
    parser.add_argument("--source", default="seed_v1", help="Value for licks.source")
    parser.add_argument("--tempo", type=int, default=76, help="Tempo used for generated seed licks")
    parser.add_argument(
        "--clear-existing",
        action="store_true",
        help="Delete existing rows for the given source before inserting",
    )
    parser.add_argument(
        "--policies",
        nargs="+",
        choices=["major_penta_root", "minor_penta_root", "mix_major_minor", "chord_tones_plus_passing"],
        default=DEFAULT_POLICIES,
        help="Note policies to seed",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    run_seed(
        source=args.source,
        tempo=args.tempo,
        clear_existing=args.clear_existing,
        policies=args.policies,
    )
