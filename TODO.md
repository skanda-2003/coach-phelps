# Skanda — Coach Phelps TODO

## Now (Before June 5)

- [ ] **Get automated daily sync working** — GitHub Action currently only runs on `workflow_dispatch`. Set up a daily cron trigger so new Strava activities appear automatically without manually hitting "Run workflow". Means `quest_log.md` stays fresh without any effort.

- [ ] **Physio for the left lower back** — flagged in Active Injury Flags since May 1. Low-intensity badminton overhead shots are still enough to trigger it. Needs an in-person assessment before badminton picks back up in any serious way.

- [ ] **May 30 — 15km long run** — the birthday run rehearsal. Holds in Zone 2, 4:1 walk-run. This is the checkpoint that tells us whether 7:00/km on June 5 is realistic, conservative, or a stretch. Don't skip this one.

---

## After June 5

- [ ] **Rename activities consistently** — quest pattern matching (`.*Run.*`) is fragile if Strava names get messy. A config-driven rename script would make `count_pattern` matching bulletproof and the history cleaner to query.

- [ ] **Structured memory when coach_notes gets long** — once `training/coach_notes.md` hits ~600 lines (probably 3-4 months in), distill permanent patterns into `training/key_insights.md` and archive the old notes. Coach reads key_insights at boot instead of digging through the full log.

- [ ] **Readiness score** — a daily 1-100 number derived from sleep, soreness, PRE score, and streak momentum. Right now Coach has to ask or infer. A score would let intensity calibration happen automatically without interrogating you every session.

- [ ] **Travel/bodyweight mode** — detect travel context (no dumbbells, no gym) and switch to a bodyweight-only plan automatically. Return protocol to ramp back up safely. Relevant any time you're away for more than 2-3 days.

---

## Someday

- [ ] **Dashboard** — activity heatmap, volume by sport over time, HR zone distribution. Probably a separate repo. Not urgent while the coaching loop is working.

- [ ] **Proactive morning briefing** — scheduled job that generates a daily summary from `state.md` + `quest_log.md` and surfaces it somewhere (notification, commit message, etc.).
