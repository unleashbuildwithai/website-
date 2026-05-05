# 🗄️ Hybrid Persistence Setup Guide

**PostgreSQL (live inbox) + GitHub (permanent archive)**

This fixes the message deletion issue caused by Render's ephemeral SQLite storage.

---

## 🚨 Problem This Solves

Render.com free tier **wipes the filesystem** whenever the server restarts, taking
your `messages.db` SQLite file with it. All messages were lost on every cold start.

**Solution:**
- **PostgreSQL** → persistent cloud database (survives restarts forever)
- **GitHub Archive** → permanent file backup when you Archive or Complete a message

---

## ✅ PHASE 1: PostgreSQL Setup (~10 minutes)

### Step 1 — Create the database

**Option A: Render (easiest — same platform as your backend)**

1. Go to [render.com/dashboard](https://render.com/dashboard)
2. Click **New +** → **PostgreSQL**
3. Name it: `geniusunleashed-db`
4. Select: **Free** tier
5. Click **Create Database**
6. Wait ~2 minutes for provisioning
7. Click the database → copy the **Internal Database URL**
   (looks like: `postgresql://user:pass@dpg-xxxxx.internal/geniusdb`)
   > ⚠️ Use the **Internal** URL when your backend is also on Render

**Option B: Supabase (alternative free option)**

1. Go to [supabase.com](https://supabase.com) → New project
2. Settings → Database → **Connection string** → copy URI

---

### Step 2 — Update backend environment variables

In your **Render backend service** → Environment:

```
DATABASE_URL = postgresql://user:pass@host:5432/dbname
NODE_ENV     = production
```

Or locally in `backend/.env`:
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/geniusunleashed
NODE_ENV=development
```

---

### Step 3 — Install pg and deploy

```bash
cd backend
npm install          # installs pg (already in package.json)
```

Then push to GitHub — Render will auto-redeploy:
```bash
git add backend/
git commit -m "🗄️ Migrate to PostgreSQL"
git push origin main
```

**Render will auto-run `npm install` and `node server.js`.**
The `initDatabase()` call creates all tables on first start automatically.

---

### Step 4 — Verify it works

Visit: `https://website-5nvl.onrender.com/api/health`

Should return:
```json
{ "status": "OK", "message": "🤖 Ardy W API is running" }
```

Submit a test message on your website → check the admin inbox.
Restart the Render service → messages should **still be there** ✅

---

## ✅ PHASE 2: GitHub Archive Setup (~5 minutes)

This lets you click **📁 Archive → GitHub** or **🏆 Complete → GitHub** in the inbox
and have messages permanently saved as files in this repo.

### Step 1 — Create a GitHub Personal Access Token

1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Click **Generate new token (classic)**
3. Name: `GeniusUnleashed Archive Bot`
4. Expiration: **No expiration** (or 1 year)
5. Scopes: check ✅ **`repo`** (full control — needed to commit files)
6. Click **Generate token**
7. **Copy the token immediately** — you won't see it again!
   (starts with `ghp_...`)

---

### Step 2 — Add GitHub env vars to your backend

In **Render backend service** → Environment, add:

```
GITHUB_TOKEN  = ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_OWNER  = unleashbuildwithai
GITHUB_REPO   = website-
GITHUB_BRANCH = main
```

Or in `backend/.env` (locally):
```env
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_OWNER=unleashbuildwithai
GITHUB_REPO=website-
GITHUB_BRANCH=main
```

---

### Step 3 — Push the messages/ folder

```bash
git add messages/
git commit -m "📁 Add message archive folder structure"
git push origin main
```

---

### Step 4 — Test it

1. Submit a test build request on the website
2. Open Admin Inbox → select the message
3. Click **📁 Archive → GitHub**
4. You should see a green toast: **✅ Saved to GitHub as archived**
5. Click **"View on GitHub →"** in the toast
6. The file should appear at:
   `https://github.com/unleashbuildwithai/website-/tree/main/messages/archived/`

---

## 📋 How the Admin Inbox Works Now

### Button Behaviour

| Button | What it does |
|--------|-------------|
| **✅ Accept** | Moves status to `accepted` (DB only) |
| **📁 Archive → GitHub** | Saves to GitHub + marks `archived` + shows `⬆ GH` badge |
| **🏆 Complete → GitHub** | Saves to GitHub + marks `completed` + shows `⬆ GH` badge |
| **↩️ Reopen** | Moves back to `new` (DB only) |
| **🗑 Delete** | Moves to trash (DB only — GitHub copy kept) |
| **💀 Delete Forever** | Removes from DB (GitHub copy kept permanently) |
| **⬆ Back up to GitHub** | Re-archives already-archived/completed messages |

### Indicators

- **`⬆ GH`** badge on message list item = backed up to GitHub
- Green pill **"Backed up to GitHub"** in detail pane = same
- **"View file →"** link opens the file directly on GitHub

---

## 🔒 Security Notes

1. **Never commit `backend/.env`** — it's in `.gitignore`
2. **Rotate your GitHub token** if it's ever exposed
3. The GitHub token only needs `repo` scope — don't give it more
4. The token is stored server-side only — never exposed to browser

---

## 🏗️ File Structure Reference

```
messages/
├── archived/
│   ├── 2026-05-05_john-doe_abc123.json    ← Full message data (JSON)
│   └── 2026-05-05_john-doe_abc123.md      ← Human-readable (Markdown)
└── completed/
    ├── 2026-05-10_jane-smith_xyz789.json
    └── 2026-05-10_jane-smith_xyz789.md
```

**Example JSON file:**
```json
{
  "id": "abc123",
  "name": "John Doe",
  "email": "john@example.com",
  "vision": "Build an AI-powered dashboard...",
  "features": "User auth, real-time data, dark mode",
  "timeline": "2-3 weeks",
  "discord": "johndoe#1234",
  "referral": "Twitter",
  "status": "completed",
  "ts": 1746500000000,
  "archive_folder": "completed",
  "archived_at": "2026-05-10T14:20:00.000Z",
  "archived_by": "Admin"
}
```

---

## 🚀 Quick Reference Commands

```bash
# Install dependencies (after PostgreSQL migration)
cd backend && npm install

# Run locally
cd backend && npm run dev

# Build frontend
cd svelte-app && npm run build

# Deploy frontend to Cloudflare
wrangler pages deploy svelte-app/dist

# Push all changes
git add . && git commit -m "✨ Hybrid persistence" && git push
```

---

## ❓ Troubleshooting

| Problem | Fix |
|---------|-----|
| `DATABASE_URL not set` | Add it to Render env vars |
| `GitHub archive failed: credentials` | Check GITHUB_TOKEN/OWNER/REPO in env |
| `GitHub API 403` | Token expired or missing `repo` scope |
| `GitHub API 404` | GITHUB_OWNER or GITHUB_REPO wrong |
| Messages still disappearing | DATABASE_URL not set — still using old SQLite path |
| `pg` module not found | Run `npm install` in `backend/` |
