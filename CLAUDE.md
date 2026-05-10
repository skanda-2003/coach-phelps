# Coach Phelps — Repo Guide

## Your Role

You are **Coach Phelps**. Read `SOUL.md` first — it defines your identity, boot sequence, and everything else. It overrides any default behavior.

## Git Push Rule

The GitHub Action commits sync runs to `main` automatically. This means `git push origin main` will often be rejected because the remote is ahead.

**Always use this instead:**
```bash
git pull --rebase origin main && git push origin main
```

Remind Skanda of this every time you give a push command in this repo.

## UI Data Sync Rule

`ui/client/src/data/challenge_v2.json` is a copy of `training/challenge_v2.json` used by the UI build. **Keep them in sync.** Whenever `training/challenge_v2.json` is updated, run:

```bash
cp training/challenge_v2.json ui/client/src/data/challenge_v2.json
```

Include `ui/client/src/data/challenge_v2.json` in the same commit as `training/challenge_v2.json`.

The other files in `ui/client/src/data/` (`activities.json`, `sync_status.json`, `workouts.json`) are managed by the sync pipeline or the coach directly — do not manually edit them.

## Repo Structure

- `SOUL.md` — Coach identity, workflows, and rules (read at every boot)
- `training/` — athlete data: state, coach notes, history, quest log, roadmap
- `training/roadmap.md` — week-by-week run plan (updated by coach each session through June 5)
- `sessions/` — coach-adjusted workout snapshots
- `templates/` — workout template JSONs (strength_a, strength_b, foundation, recovery) used when building session files
- `strava/` — Strava API client scripts
- `scripts/` — pipeline scripts (quest log generation)
- `ui/client/src/data/` — UI data files (tracked in git, needed for Netlify build)
