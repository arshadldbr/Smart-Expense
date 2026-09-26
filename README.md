# Smart Expense Tracker — GitHub Pages

This package is configured to deploy automatically to GitHub Pages when you push it to the repository's `main` branch.

## Deploy
1. Create/use a GitHub repository.
2. Push **all files in this package** to the `main` branch.
3. GitHub Actions will install dependencies, build the React app, and publish `dist/` to GitHub Pages.
4. In the repository, open **Settings → Pages** and make sure the source is **GitHub Actions**.

The Vite configuration automatically detects whether the repository is a normal project site (`https://USER.github.io/REPO/`) or a user site (`https://USER.github.io/`).

## Firebase authentication
The app uses Firebase Email/Password Authentication. The existing Firebase web configuration is already included in `src/services/firebase.ts`. Firebase requires Email/Password to be enabled and the deployed GitHub Pages domain to be an authorized domain.

The authentication flow has been hardened so the Firebase auth-state observer is the single source of truth after sign-up/sign-in, and a React error boundary now shows the actual runtime error instead of a white blank screen.
