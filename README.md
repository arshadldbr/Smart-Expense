# Smart Expense Tracker — GitHub Pages Fixed

This package is prepared to work when the repository is published directly from the branch root.

## Deploy
1. Extract this ZIP.
2. Push all files to your GitHub repository.
3. In GitHub Pages, select **Deploy from a branch**, choose your publishing branch (usually `main`) and the `/ (root)` folder.
4. Open the Pages URL.

The root `index.html` loads the included self-contained `deployed_bundle.js` with a relative path, so it works both at a root Pages site and at a repository Pages path.

Firebase Email/Password authentication is already wired in the included bundle. In Firebase Authentication → Settings → Authorized domains, add the hostname of your GitHub Pages site (for example `aadldbr.github.io`) if it is not already present.
