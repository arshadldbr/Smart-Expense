import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, Plugin} from 'vite';

// Plugin to automatically copy index.html to 404.html on build for GitHub Pages SPA routing/refreshes
// and produce a 100% self-contained single-file HTML version for offline local use without any server
function githubPagesSpa(): Plugin {
  return {
    name: 'github-pages-spa',
    closeBundle() {
      const distDir = path.resolve(process.cwd(), 'dist');
      const indexPath = path.join(distDir, 'index.html');
      const notFoundPath = path.join(distDir, '404.html');
      if (fs.existsSync(indexPath)) {
        fs.copyFileSync(indexPath, notFoundPath);
      }

      // Generate single-file standalone index.html
      const assetsDir = path.join(distDir, 'assets');
      if (fs.existsSync(assetsDir)) {
        const files = fs.readdirSync(assetsDir);
        const cssFiles = files.filter((f) => f.endsWith('.css'));
        const jsFiles = files.filter((f) => f.endsWith('.js'));

        let combinedCss = '';
        for (const cf of cssFiles) {
          combinedCss += fs.readFileSync(path.join(assetsDir, cf), 'utf8') + '\n';
        }

        let combinedJs = '';
        for (const jf of jsFiles) {
          combinedJs += fs.readFileSync(path.join(assetsDir, jf), 'utf8') + '\n';
        }

        // Sanitize closing script tags inside JS
        const safeJs = combinedJs.replace(/<\/script>/gi, '<\\/script>');

        const standaloneHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Smart Expense Tracker - Offline Standalone App</title>
    <meta name="description" content="Modern personal finance, budgeting, and expense management application with real-time summaries, smart categorization, savings goals, and loan tracking." />
    <meta property="og:title" content="Smart Expense Tracker" />
    <style>
${combinedCss}
    </style>
  </head>
  <body class="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased">
    <div id="root"></div>
    <script>
${safeJs}
    </script>
  </body>
</html>`;

        // Save to dist/smart-expense-standalone.html
        fs.writeFileSync(path.join(distDir, 'smart-expense-standalone.html'), standaloneHtml, 'utf8');
        // Save to public directory so it's accessible via preview and GitHub Pages
        const publicDir = path.resolve(process.cwd(), 'public');
        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir, { recursive: true });
        }
        fs.writeFileSync(path.join(publicDir, 'smart-expense-standalone.html'), standaloneHtml, 'utf8');
        // Also save to root as smart-expense-standalone.html
        fs.writeFileSync(path.resolve(process.cwd(), 'smart-expense-standalone.html'), standaloneHtml, 'utf8');
      }
    },
  };
}

export default defineConfig(() => {
  return {
    base: '/Smart-Expense/',
    plugins: [react(), tailwindcss(), githubPagesSpa()],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
