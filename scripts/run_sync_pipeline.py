#!/usr/bin/env python3
"""Sync pipeline for CI: fetch recent Strava activities, merge with committed data, write UI bundle."""

import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO_DIR = Path(__file__).resolve().parent.parent
TRAINING_DIR = REPO_DIR / "training"
HISTORY_DIR = TRAINING_DIR / "history"
DATA_DIR = REPO_DIR / "ui" / "client" / "src" / "data"
TOKENS_PATH = REPO_DIR / "strava" / "strava_tokens.json"
SYNC_STATUS_PATH = TRAINING_DIR / "sync_status.json"


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
        "expires_at": 0,  # force refresh on first use
    }
    TOKENS_PATH.parent.mkdir(parents=True, exist_ok=True)
    TOKENS_PATH.write_text(json.dumps(tokens, indent=2) + "\n")
    print("Strava tokens written from environment.")


def fetch_recent():
    print("Fetching last 30 Strava activities...")
    HISTORY_DIR.mkdir(parents=True, exist_ok=True)
    result = subprocess.run(
        [sys.executable, str(REPO_DIR / "strava" / "fetch_strava.py"), "--last", "30", "--save"],
        cwd=REPO_DIR,
    )
    if result.returncode != 0:
        sys.exit(f"Strava fetch failed with exit code {result.returncode}")


def load_json_safe(path):
    try:
        return json.loads(Path(path).read_text())
    except Exception:
        return None


def main():
    if os.environ.get("CI"):
        write_tokens_from_env()

    fetch_recent()

    # Use committed activities.json as base so full history is preserved across CI runs
    base = load_json_safe(DATA_DIR / "activities.json") or []

    new = []
    for f in sorted(HISTORY_DIR.glob("*.json")):
        data = load_json_safe(f)
        if data:
            new.append(data)

    # Merge by activity ID — freshly fetched version wins (picks up renames/edits)
    by_id = {a["id"]: a for a in base}
    for a in new:
        by_id[a["id"]] = a
    merged = sorted(by_id.values(), key=lambda a: a.get("start_date_local", ""), reverse=True)
    new_count = max(0, len(merged) - len(base))

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
        "commit_message": f"core: sync {now.strftime('%Y-%m-%d %H:%M')} UTC — {new_count} new [skip ci]",
    }
    SYNC_STATUS_PATH.write_text(json.dumps(status, indent=2) + "\n")
    (DATA_DIR / "sync_status.json").write_text(json.dumps(status, indent=2) + "\n")
    print(f"Sync complete — {len(merged)} activities, {new_count} new.")


if __name__ == "__main__":
    main()
