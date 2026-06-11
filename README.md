# BTRT Awards 2026 Mock Portal — v6

Static GitHub Pages mock for the BTRT Awards workflow.

## Demo login

Single passcode:

```text
BTRT2026
```

## What this version includes

- Peer nomination form
- Optional supporting link, notes and file uploads
- File preview before submission
- Files stored locally in the browser via localStorage for mock testing
- HR / HOD / Director review workspace where names are visible
- Status changes: Peer Submitted, HR / HOD Review, More Info Needed, Director Endorsed, Finalist, Not Shortlisted
- Blind Judge Scoring tab where nominee, nominator, company and department names are hidden
- Judge flow: read nomination story → click Next to view attachments → click Next to score
- Anonymous judge scoring sessions
- Blind finalist ranking table
- Demo data with mock attachments
- JSON and CSV export

## Important mock limitations

This is a static front-end prototype. It does not have a real backend.

Uploaded files are stored in the current browser only. They are not sent to a server and cannot be seen by other users/devices.

For real blind judging, HR should upload redacted attachments. This mock hides filenames and identity fields, but it cannot redact names inside the actual file content.

For a production version, connect it to Microsoft SSO, SharePoint List / Dataverse / Supabase / Firebase / n8n and proper file storage.

## Upload to GitHub Pages

Upload or replace these files in your GitHub repo:

```text
index.html
styles.css
script.js
README.md
```

Then open your GitHub Pages URL and hard refresh:

```text
Mac: Cmd + Shift + R
Windows: Ctrl + Shift + R
```

## Test flow

1. Open the page as Employee View.
2. Submit a nomination. Attach a small test file if needed.
3. Login with `BTRT2026`.
4. Open Review Workspace.
5. Load demo data or review the submitted nomination.
6. Mark a nomination as Finalist.
7. Open Blind Judge Scoring.
8. Review story → click Next to attachments → click Next to scoring.
9. Save scores as Anonymous Judge A/B/C/D.
10. Check the blind ranking table.
