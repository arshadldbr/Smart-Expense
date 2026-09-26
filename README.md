# Smart Expense Tracker

A React + Vite personal finance tracker with Firebase email/password authentication. Each authenticated user gets an isolated local-storage namespace in the browser, so one account cannot read another account's tracker data on the same device.

## Run locally

**Prerequisites:** Node.js 20+

```bash
npm ci --legacy-peer-deps
cp .env.example .env.local
npm run dev
```

The existing Firebase project configuration is used by default. For a fork or a new Firebase project, replace the `VITE_FIREBASE_*` values in `.env.local` with the Web App configuration from Firebase Console. These values are frontend configuration, not server secrets; do not put an Admin SDK service-account key in this repository.

## Enable email authentication in Firebase

1. Open **Firebase Console → Authentication → Sign-in method**.
2. Enable **Email/Password** and save.
3. In **Authentication → Settings → Authorized domains**, add the GitHub Pages domain, for example `your-user.github.io`.
4. If the repository is deployed at a project path, the app URL will be `https://your-user.github.io/your-repository/`.
5. Password reset emails use Firebase's configured email template and authorized domain settings.

The app supports:

- Email/password sign in
- New account registration with display name
- Password reset email
- Friendly Firebase error messages
- Persistent auth sessions through Firebase Auth
- Per-user local data isolation

## Build and validate

```bash
npm run lint
npm run build
```

The Vite build creates both `dist/index.html` and `dist/404.html` so GitHub Pages can refresh SPA routes safely.

## GitHub Pages deployment

The workflow at `.github/workflows/deploy.yml` deploys on every push to `main`. In the repository settings:

1. Go to **Settings → Pages**.
2. Set **Source** to **GitHub Actions**.
3. Ensure the workflow has Pages write and OIDC permissions (already declared in the workflow).
4. Push the repository to `main` and wait for the **Deploy to GitHub Pages** workflow.

The repository path is part of the Vite base URL (`/Smart-Expense/`). If the repository name differs, update `base` in `vite.config.ts` before deploying.

## Important data note

The current tracker stores financial records in browser `localStorage`, scoped by Firebase `uid`; Firebase authenticates users but does not sync records to Firestore. Export a JSON backup from Settings before clearing browser data or changing devices.
