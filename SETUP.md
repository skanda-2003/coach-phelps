# Coach Phelps — Setup Guide

## 1. Clone the repo

```bash
git clone https://github.com/akash-suresh/coach-phelps-template.git
cd coach-phelps-template
```

## 2. Install dependencies

```bash
pip3 install requests
```

## 3. Strava setup

**Create a Strava API app:**
1. Go to [strava.com/settings/api](https://www.strava.com/settings/api)
2. Create an app — set the callback URL to `http://localhost`
3. Note your **Client ID** and **Client Secret**

**Configure credentials:**
```bash
cp .env.example .env
# Open .env and fill in STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET
```

**Authorize:**
```bash
python strava/oauth_reauth.py
```
This opens a browser window. Authorize the app. Tokens are saved automatically to `strava/strava_tokens.json`.

**Test the connection:**
```bash
python strava/fetch_strava.py --last 3
```
You should see your last 3 Strava activities printed.

## 4. Customize HR zones

Open `strava/fetch_strava.py` and `strava/query_history.py`. Find the `HR_ZONES` block marked with `# CUSTOMIZE` and update the BPM values to match your personal zones.

Simple estimate: Zone 2 upper ≈ 70% of max HR (max HR ≈ 220 − age).

## 5. Sync your history

```bash
python strava/fetch_strava.py --sync --since YYYY-MM-DD
```
Replace `YYYY-MM-DD` with the date you want history from (e.g., the start of your current training block).

## 6. First session with Coach Phelps

**Claude Code (recommended):**
```bash
# From the repo root:
claude
```
Coach Phelps will detect the blank `training/state.md` and run your intake automatically.

**Claude.ai:**
Upload `SOUL.md` and `training/state.md` as attachments to start a new conversation.

During the first session, the coach will:
- Ask you 8 intake questions (conversational, not a form)
- Confirm your profile
- Write your `training/state.md`
- Set up your quest system in `training/challenge_v2.json`
- Commit both files

## 7. Generate your quest log

After quests are configured:
```bash
python scripts/generate_quest_log.py
```
This produces `training/quest_log.md` — your live progress dashboard. The coach reads this at every boot.

---

## What gets committed to your repo

- `training/state.md` — your profile, injury flags, week plan (coach writes)
- `training/challenge_v2.json` — quest data (coach writes)
- `training/coach_notes.md` — session insights (coach appends)
- `training/quest_log.md` — auto-generated dashboard (script writes)
- `training/history/*.json` — Strava activity data (sync script writes)

`strava/strava_tokens.json` is excluded from git (`.gitignore`) — keep it local.
