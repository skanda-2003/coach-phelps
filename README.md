# Coach Phelps

My AI coaching system. Coach Phelps is Michael Phelps as a coaching persona - process-obsessed, emotionally honest. Tracks training via Strava, manages a quest/streak system, and builds a living memory across sessions.

Start a session: `claude` in this directory.

---

## Common Commands

```bash
# Sync latest Strava activities
python3 strava/fetch_strava.py --sync

# Regenerate quest log (run after updating challenge_v2.json)
python3 scripts/generate_quest_log.py

# Query recent activity history
python3 strava/query_history.py --last 7d

# Reauthorize Strava (if tokens expire)
python3 strava/oauth_reauth.py
```

---

## What lives here

| File | Written by | Purpose |
|------|-----------|---------|
| `SOUL.md` | Me | Coach identity, rules, workflows |
| `training/state.md` | Coach | Profile, injuries, week plan |
| `training/challenge_v2.json` | Coach | Quest and streak data |
| `training/coach_notes.md` | Coach | Session insights (append-only) |
| `training/quest_log.md` | Script (auto) | Live progress dashboard |
| `training/roadmap.md` | Coach | Week-by-week run plan, updated each session |
| `training/history/*.json` | Sync script | Strava activity data (git-ignored) |
| `strava/strava_tokens.json` | OAuth script | API tokens (git-ignored) |
| `templates/` | Me | Workout templates used when building session files |

---

## Scripts

| Script | Purpose |
|--------|---------|
| `strava/fetch_strava.py` | Fetch and sync activities from Strava |
| `strava/query_history.py` | Search and filter local activity history |
| `strava/oauth_reauth.py` | Reauthorize Strava API |
| `scripts/generate_quest_log.py` | Regenerate `training/quest_log.md` |
| `scripts/run_sync_pipeline.py` | Full pipeline run (used by GitHub Action) |
