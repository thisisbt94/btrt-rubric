[README.md](https://github.com/user-attachments/files/28789899/README.md)
# BTRT Awards 2026 Mock Portal v3

Static GitHub Pages prototype for the BTRT Awards workflow:

1. Peer Nomination
2. Company Submission
3. HR / HOD Review
4. Director Endorsement
5. Judges Portal and weighted scoring
6. Admin export/import and optional webhook testing

## Upload to GitHub Pages

Upload these files together into the root of your `btrt-rubric` repo:

- `index.html`
- `styles.css`
- `script.js`
- `README.md` optional

Then open:

`https://thisisbt94.github.io/btrt-rubric/`

Hard refresh after upload.

## Demo role login

This is only a mock gate, not real security.

- HR / HOD: `HR2026`
- Judge: `JUDGE2026`
- Admin: `ADMIN2026`

## Demo data

Log in as Admin, open **Admin / Export / Backend Settings**, then click **Load 6 demo nominations**.

The demo set includes:

- 4 peer nominations
- 6 company nomination packages
- 3 finalists
- sample scores from Judge 01 and Judge 02
- different statuses: Finalist, Shortlisted, Validated, Needs Detail

## How to test tomorrow

1. Open the page.
2. Log in as Admin using `ADMIN2026`.
3. Load the 6 demo nominations.
4. Log in as HR using `HR2026` and review the HR / HOD Dashboard.
5. Change any nomination status to `Finalist`.
6. Log in as Judge using `JUDGE2026`.
7. Go to Judges Portal, select a finalist and submit a score.
8. Check the finalist ranking table.
9. Export JSON or CSV from Admin.

## Backend / submitter visibility

GitHub Pages is static. It cannot securely authenticate users or centrally store real submissions by itself.

This mock stores data in the browser using `localStorage`. For a real rollout, use one of these:

- Microsoft Forms + SharePoint List + Power Automate
- Microsoft Entra ID / SSO + SharePoint or Dataverse
- Supabase or Firebase Auth + database
- n8n webhook + database
- Google Apps Script + Google Sheets for quick testing

The Admin page includes an optional webhook setting so a test POST can be sent to a backend endpoint, but real login and privacy must be implemented server-side.
