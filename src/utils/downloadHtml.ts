/**
 * Helper to download the standalone single-file HTML version of Smart Expense Tracker.
 * Allows users to run the complete application offline directly from their browser.
 */
export async function downloadStandaloneHtml() {
  const candidateUrls = [
    './smart-expense-standalone.html',
    '/Smart-Expense/smart-expense-standalone.html',
    '/smart-expense-standalone.html',
    'smart-expense-standalone.html',
  ];

  for (const url of candidateUrls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const htmlText = await response.text();
        if (htmlText && htmlText.includes('<!doctype html>')) {
          triggerFileDownload(htmlText, 'Smart-Expense.html');
          return true;
        }
      }
    } catch {
      // Continue to next candidate
    }
  }

  // If fetch failed (e.g. strict origin in preview iframe), open direct URL in new window/tab
  const fallbackA = document.createElement('a');
  fallbackA.href = './smart-expense-standalone.html';
  fallbackA.target = '_blank';
  fallbackA.download = 'Smart-Expense.html';
  document.body.appendChild(fallbackA);
  fallbackA.click();
  document.body.removeChild(fallbackA);
  return false;
}

function triggerFileDownload(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
}
