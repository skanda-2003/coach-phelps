# coach-phelps-template — TODO

## Done (v1)
- [x] SOUL.md — generic Phelps identity + First Session Protocol
- [x] training/state.md — blank athlete template
- [x] training/challenge_v2.json — parameterized quest schema (config-driven patterns, no hardcoded sport logic)
- [x] scripts/generate_quest_log.py — fully config-driven (weekly_targets + main quest regex from JSON)
- [x] Strava sync scripts — fetch_strava.py, query_history.py, strava_api.py, oauth_reauth.py
- [x] SETUP.md — clone → Strava auth → HR zones → first session guide
- [x] .gitignore, .env.example
- [x] README.md, CLAUDE.md

---

## P0 — V2 Core

- [ ] **Automated daily sync (GitHub Action)** — daily cron that runs `fetch_strava.py --sync` and pushes new history files. Removes the need to manually sync after every workout. Adapt from Sky's pipeline (strip badminton-specific steps).

- [ ] **Workout template system** — blank template schema + SOUL.md section guiding Coach to build sport-specific templates during first session. Enables the session file workflow (`sessions/YYYY-MM-DD_<id>.json`) and opens the path to a timer app.

---

## P1 — V2 Enhancements

- [ ] **Dashboard (coach-dashboard-template)** — separate repo fork. Generic only: activity heatmap, volume by sport type over time, HR zone distribution, streak counters. No match/game analytics (those are sport-specific extensions). Needs `build-data.mjs` equivalent that works from generic Strava history.

- [ ] **Activity rename system** — config-driven rename pipeline. User defines sport → naming pattern mappings in a config file. Makes activity names consistent and makes quest `count_pattern` matching more reliable. Adapt `rename_core.py` to read from config instead of hardcoded sport logic.

- [ ] **SOUL.md v2** — iterate on First Session Protocol and coaching quality after first 2-3 real users. Expected gaps: quest setup flow, weekly planning for unfamiliar sports, goal-setting depth.

---

## P2 — Later

- [ ] **Proactive morning briefing** — scheduled task (GitHub Action or cron) that generates a daily briefing from state.md + quest_log.md and surfaces it via a notification or commit.

- [ ] **Milestone quest type** — schema already supports `milestone` type but it's undocumented and unrendered in generate_quest_log.py. Document and implement rendering.

- [ ] **Structured memory system** — when `training/coach_notes.md` exceeds ~600 lines, distill permanent patterns into `training/key_insights.md` and archive old notes. Relevant ~6 months in for active users.

- [ ] **Travel/bodyweight mode** — Coach detects travel context and switches to a bodyweight-only plan. Return protocol to ramp back up. Define in SOUL.md.

- [ ] **Readiness score** — daily 1-100 score derived from sleep, soreness, PRE, and streak data. Helps Coach calibrate session intensity without asking every time.
