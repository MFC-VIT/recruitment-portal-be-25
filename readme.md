# MFC Recruitment Portal — Candidate Backend

Express + MongoDB API behind the candidate portal (Enrollments). The admin
portal has its own backend and shares this database.

## Run locally

```bash
cp .env.example .env   # fill in
npm install
npm start              # http://localhost:5000/ping
```

## What lives where

| Area | Files |
| --- | --- |
| Auth (signup, OTP, login, refresh, reset) | `api/controllers/authController.js`, `api/utils/tokens.js` |
| Questions (data, not code) | `api/models/questionModel.js`, `GET /questions/:domain` |
| Task submissions | `api/models/submissionModel.js`, `/upload/:domain/:id` (PATCH = draft, POST = final) |
| Round history | `api/models/statusEventModel.js` |
| Candidate tracker | `GET /applicatiostatus/timeline/:id` |
| Interviews | `api/meet/schedule.js` (book / cancel / reschedule), `api/meet/panel.js` (auto panels), `api/meet/reminders.js` |
| Offers + onboarding | `/offers/*`, `api/models/offerModel.js`, `api/models/settingModel.js` |
| Sign in with GitHub | `/github/*`, `api/utils/github.js` |
| Browser push | `/push/*`, `api/utils/push.js` |

Round values per domain: `-1` rejected, `0` under review, `1` interview round,
`2` selected, `3` core.

## One-time data setup

All scripts are dry runs unless given `--apply`, and none delete anything.

```bash
node api/seed/seedQuestions.js --apply        # questions.json -> questions (keeps rubrics)
node api/seed/migrateSubmissions.js           # report what would move
node api/seed/migrateSubmissions.js --apply   # techtasks/designtasks/managementtasks -> submissions
node api/seed/importInterviewers.js --apply   # old hardcoded panel list -> interviewers
```

To change questions for a new cycle, edit `api/seed/questions.json` (keep keys
stable for questions whose answers you want to keep) and re-run the seed.

## Interview panels

When the `interviewers` collection has anyone active, each booking gets a
panel of `PANEL_SIZE` people: at least one per domain the candidate is being
interviewed for, least-loaded first, preferring matching subdomain expertise,
skipping anyone over their daily cap, marked unavailable, already on a panel at
that time, or busy in Google Calendar (when their free/busy is visible to the
connected admin account). With no interviewers configured it falls back to
inviting the legacy list, as before.

Connect the calendar once, logged in as an admin:
`<backend>/api/meet/auth?token=<admin access token>`.

## Tests

```bash
mongod --dbpath /tmp/mfc-smoke --port 27099 &   # throwaway local Mongo
npm run smoke                                   # refuses non-local databases
```
