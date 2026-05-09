#!/usr/bin/env python3
"""Sync pipeline for CI: fetch only new Strava activities, merge with committed data, write UI bundle."""

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO_DIR = Path(__file__).resolve().parent.parent
TRAINING_DIR = REPO_DIR / "training"
DATA_DIR = REPO_DIR / "ui" / "client" / "src" / "data"
TOKENS_PATH = REPO_DIR / "strava" / "strava_tokens.json"
SYNC_STATUS_PATH = TRAINING_DIR / "sync_status.json"

sys.path.insert(0, str(REPO_DIR / "strava"))


def write_tokens_from_env():
    client_id = os.environ.get("STRAVA_CLIENT_ID")
    client_secret = os.environ.get("STRAVA_CLIENT_SECRET")
    refresh_token = os.environ.get("STRAVA_REFRESH_TOKEN")
    if not all([client_id, client_secret, refresh_token]):
        sys.exit("CI sync requires STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_REFRESH_TOKEN secrets.")
    tokens = {
        "client_id": client_id,
        "client_secret": client_secret,
        "access_token": "",
        "refresh_token": refresh_token,
        "expires_at": 0,
    }
    TOKENS_PATH.parent.mkdir(parents=True, exist_ok=True)
    TOKENS_PATH.write_text(json.dumps(tokens, indent=2) + "\n")
    print("Strava tokens written from environment.")


def load_json_safe(path):
    try:
        return json.loads(Path(path).read_text())
    except Exception:
        return None


def fetch_new_activities(existing_ids):
    from strava_api import load_tokens, refresh_if_needed, api_get
    from fetch_strava import compute_hr_zones, HR_ZONES

    tokens = refresh_if_needed(load_tokens())

    # 1 API call to list recent activities
    summaries = api_get(tokens, "/athlete/activities", {"per_page": 30})
    new_summaries = [a for a in summaries if a["id"] not in existing_ids]

    if not new_summaries:
        print("No new activities.")
        return []

    print(f"Found {len(new_summaries)} new activities — enriching...")
    enriched = []
    for summary in new_summaries:
        detail = api_get(tokens, f"/activities/{summary['id']}")
        activity = {**detail}

        if summary.get("has_heartrate"):
            zone_seconds = compute_hr_zones(tokens, summary["id"])
            if zone_seconds:
                activity["hr_zones"] = {
                    name: {"low": low, "high": high, "seconds": secs}
                    for (name, low, high), secs in zip(HR_ZONES, zone_seconds)
                }

        enriched.append(activity)
        print(f"  Enriched: {activity.get('name', activity['id'])}")

    return enriched


def main():
    if os.environ.get("CI"):
        write_tokens_from_env()

    base = load_json_safe(DATA_DIR / "activities.json") or []
    existing_ids = {a["id"] for a in base}

    new_activities = fetch_new_activities(existing_ids)

    # Merge: new activities override base for same ID, new ones are added
    by_id = {a["id"]: a for a in base}
    for a in new_activities:
        by_id[a["id"]] = a
    merged = sorted(by_id.values(), key=lambda a: a.get("start_date_local", ""), reverse=True)
    new_count = len(new_activities)

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    (DATA_DIR / "activities.json").write_text(json.dumps(merged))
    print(f"activities.json: {len(merged)} activities ({new_count} new)")

    src = TRAINING_DIR / "challenge_v2.json"
    if src.exists():
        (DATA_DIR / "challenge_v2.json").write_text(src.read_text())
        print("challenge_v2.json copied")

    (DATA_DIR / "workouts.json").write_text(json.dumps({"templates": [], "sessions": []}))

    now = datetime.now(timezone.utc)
    status = {
        "status": "ok",
        "timestamp": now.isoformat(),
        "activities_synced": len(merged),
        "activities_renamed": 0,
        "descriptions_parsed": 0,
        "warnings": [],
        "commit_message": f"core: sync {now.strftime('%Y-%m-%d %H:%M')} UTC - {new_count} new",
    }
    SYNC_STATUS_PATH.write_text(json.dumps(status, indent=2) + "\n")
    (DATA_DIR / "sync_status.json").write_text(json.dumps(status, indent=2) + "\n")
    print(f"Sync complete - {len(merged)} total, {new_count} new.")


if __name__ == "__main__":
    main()
