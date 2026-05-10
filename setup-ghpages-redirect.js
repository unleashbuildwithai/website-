/**
 * Sets up gh-pages branch with a redirect to Cloudflare Pages URL
 * Run: node setup-ghpages-redirect.js
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const REPO_DIR = 'c:\\Users\\Owner\\Desktop\\html';
const CLOUDFLARE_URL = 'https://geniusunleashed.pages.dev';
const REMOTE_URL = 'https://github.com/unleashbuildwithai/website-.git';

// The redirect HTML page
const redirectHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="refresh" content="0; url=${CLOUDFLARE_URL}" />
  <link rel="canonical" href="${CLOUDFLARE_URL}" />
  <title>Ardy W | Genius Unleashed — Redirecting...</title>
  <style>
    body { font-family: sans-serif; background: #0a0a0a; color: #ccc; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
    a { color: #00d4ff; }
  </style>
</head>
<body>
  <p>Redirecting to <a href="${CLOUDFLARE_URL}">${CLOUDFLARE_URL}</a>...</p>
  <script>window.location.replace("${CLOUDFLARE_URL}");</script>
</body>
</html>`;

// Create a temp directory for the gh-pages content
const tmpDir = path.join(os.tmpdir(), 'gh-pages-redirect-' + Date.now());
fs.mkdirSync(tmpDir, { recursive: true });

let log = '';
function run(cmd, cwd) {
  log += `\n$ ${cmd}\n`;
  try {
    const out = execSync(cmd, { cwd: cwd || tmpDir, encoding: 'utf8', stdio: ['pipe','pipe','pipe'] });
    log += out + '\n';
    return out;
  } catch(e) {
    const err = (e.stdout || '') + (e.stderr || '');
    log += err + '\n';
    return err;
  }
}

try {
  // 1. Clone just the gh-pages branch (shallow) into temp dir
  log += `\n=== Setting up gh-pages redirect ===\n`;
  log += `Temp dir: ${tmpDir}\n`;

  // Init a fresh git repo in temp dir
  run('git init');
  run(`git remote add origin ${REMOTE_URL}`);
  
  // Try to fetch gh-pages branch
  const fetchResult = run('git fetch origin gh-pages --depth=1');
  
  if (fetchResult.includes('fatal') || fetchResult.includes('couldn\'t find remote ref')) {
    // gh-pages branch doesn't exist - create orphan
    log += '\ngh-pages branch does not exist, creating orphan branch...\n';
    run('git checkout --orphan gh-pages');
  } else {
    run('git checkout gh-pages');
  }
  
  // 2. Write the redirect index.html
  fs.writeFileSync(path.join(tmpDir, 'index.html'), redirectHTML, 'utf8');
  log += '\nWrote redirect index.html\n';
  
  // 3. Commit and push
  run('git config user.email "deploy@geniusunleashed.pages.dev"');
  run('git config user.name "Genius Unleashed Deploy"');
  run('git add index.html');
  run('git commit -m "Redirect: GitHub Pages → geniusunleashed.pages.dev"');
  run('git push origin gh-pages --force');
  
  log += '\n=== DONE! gh-pages redirect pushed successfully ===\n';
  log += `Old URL will redirect to: ${CLOUDFLARE_URL}\n`;

} catch (err) {
  log += `\nERROR: ${err.message}\n`;
}

// Write log to file
fs.writeFileSync(path.join(REPO_DIR, 'ghpages-result.txt'), log, 'utf8');
console.log(log);
