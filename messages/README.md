# 📥 Build Request Archives

This folder stores **permanent backups** of client build requests, automatically committed here from the Admin Inbox.

## Structure

```
messages/
├── archived/     📁 Archived requests (filed away, not yet completed)
│   ├── 2026-05-05_john-doe_abc123.json
│   └── 2026-05-05_john-doe_abc123.md
├── completed/    ✅ Completed projects
│   ├── 2026-05-10_jane-smith_xyz789.json
│   └── 2026-05-10_jane-smith_xyz789.md
└── README.md     (this file)
```

## How it works

1. A client fills out the **Initiate Build** form on the website
2. Message is stored in the **PostgreSQL database** (live inbox)
3. When you click **📁 Archive → GitHub** or **🏆 Complete → GitHub** in the Admin Inbox:
   - Message data is saved here as both **JSON** (machine-readable) and **Markdown** (human-readable)
   - The database record is marked as `github_archived = true`
   - The message status is updated to `archived` or `completed`
4. Even if the backend restarts, **the data lives here forever**

## File naming

Files are named: `YYYY-MM-DD_client-name_message-id.{json,md}`

## Notes

- `.gitkeep` files keep the empty folders tracked by git
- JSON files contain the full message data
- Markdown files are easy to read directly on GitHub
- **Never delete files from here** — they are your permanent record
