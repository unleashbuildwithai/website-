/**
 * github-archive.js
 * Saves messages as JSON + Markdown files to the repository.
 *
 * PRIMARY method   — writes to local messages/ folder + git commit + push
 *                    (works without any API tokens, uses git directly)
 * SECONDARY method — GitHub Contents API (requires GITHUB_TOKEN in .env)
 *                    used as a backup when local git is not available
 */

const https        = require('https');
const path         = require('path');
const fs           = require('fs').promises;
const { exec }     = require('child_process');
const { promisify} = require('util');
const execAsync    = promisify(exec);

const {
  GITHUB_TOKEN,
  GITHUB_OWNER,
  GITHUB_REPO,
  GITHUB_BRANCH = 'main'
} = process.env;

// ─── Paths ────────────────────────────────────────────────
const MESSAGES_DIR = path.resolve(__dirname, '..', 'messages');
const REPO_ROOT    = path.resolve(__dirname, '..');

// ─── Build the file name stem ──────────────────────────────
function buildStem(message) {
  const date    = new Date(message.ts || Date.now());
  const dateStr = date.toISOString().split('T')[0];
  const name    = (message.name || 'unknown')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30);
  const id      = (message.id || '').slice(-6);
  return `${dateStr}_${name}_${id}`;
}

// ─── Build JSON content ────────────────────────────────────
function buildJSON(message, folder) {
  return JSON.stringify(
    {
      ...message,
      archive_folder: folder,
      archived_at:    new Date().toISOString(),
      archived_by:    'Admin'
    },
    null,
    2
  );
}

// ─── Build Markdown content ────────────────────────────────
function buildMarkdown(message, folder) {
  const date  = new Date(message.ts || Date.now());
  const emoji = folder === 'completed' ? '✅' : '📁';
  const lines = [
    `# ${emoji} Build Request — ${message.name || 'Unknown'}`,
    '',
    `| Field      | Value |`,
    `|------------|-------|`,
    `| **Status** | ${folder.charAt(0).toUpperCase() + folder.slice(1)} |`,
    `| **ID**     | \`${message.id}\` |`,
    `| **Email**  | ${message.email || 'N/A'} |`,
    `| **Timeline** | ${message.timeline || 'Not specified'} |`,
    `| **Submitted** | ${date.toLocaleString('en-US', { timeZone: 'America/Chicago' })} CST |`,
    `| **Archived** | ${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })} CST |`,
    '',
    '---',
    '',
    '## 💡 Vision / Description',
    '',
    message.vision || '_No description provided_'
  ];

  if (message.features) {
    lines.push('', '## 🛠 Core Features', '', message.features);
  }
  if (message.discord) {
    lines.push('', '## 💬 Discord', '', message.discord);
  }
  if (message.referral) {
    lines.push('', '## 📣 Referral', '', message.referral);
  }

  return lines.join('\n') + '\n';
}

// ─────────────────────────────────────────────────────────
// PRIMARY: Save locally + git commit + push
// Works on the local dev server without any API tokens.
// ─────────────────────────────────────────────────────────
async function archiveLocally(message, folder) {
  const stem    = buildStem(message);
  const dir     = path.join(MESSAGES_DIR, folder);
  const relJson = `messages/${folder}/${stem}.json`;
  const relMd   = `messages/${folder}/${stem}.md`;

  // Create folder if needed
  await fs.mkdir(dir, { recursive: true });

  // Write files
  await fs.writeFile(path.join(dir, `${stem}.json`), buildJSON(message, folder),     'utf8');
  await fs.writeFile(path.join(dir, `${stem}.md`),   buildMarkdown(message, folder), 'utf8');

  console.log(`📁 Saved locally: ${relJson}`);

  // Git commit + push
  const emoji     = folder === 'completed' ? '✅' : '📁';
  const commitMsg = `${emoji} ${folder}: ${message.name || 'Unknown'} (${(message.id || '').slice(-6)})`;
  const safemsg   = commitMsg.replace(/"/g, '\\"');

  try {
    await execAsync(`git -C "${REPO_ROOT}" add "${relJson}" "${relMd}"`);
    await execAsync(`git -C "${REPO_ROOT}" commit -m "${safemsg}"`);
    await execAsync(`git -C "${REPO_ROOT}" push origin main`);
    console.log(`✅ Git pushed: ${relJson}`);
  } catch (gitErr) {
    // Files are saved locally even if push failed
    console.warn('⚠️  Git push failed (file saved locally):', gitErr.stderr || gitErr.message);
  }

  return { stem, jsonPath: relJson, mdPath: relMd };
}

// ─────────────────────────────────────────────────────────
// SECONDARY: GitHub Contents API (requires token)
// Used as additional backup or in server-only environments.
// ─────────────────────────────────────────────────────────
function getSHA(filePath) {
  return new Promise(resolve => {
    if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) return resolve(null);

    const options = {
      hostname: 'api.github.com',
      path: `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}?ref=${GITHUB_BRANCH}`,
      method: 'GET',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'User-Agent': 'GeniusUnleashed-Backend/1.0',
        Accept: 'application/vnd.github.v3+json'
      }
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', c => (data += c));
      res.on('end', () => {
        try { resolve(res.statusCode === 200 ? JSON.parse(data).sha : null); }
        catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.end();
  });
}

function putFile(filePath, content, commitMessage, sha) {
  return new Promise((resolve, reject) => {
    if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
      return reject(new Error('GitHub credentials not configured'));
    }

    const body = JSON.stringify({
      message: commitMessage,
      content: Buffer.from(content).toString('base64'),
      branch:  GITHUB_BRANCH,
      ...(sha ? { sha } : {})
    });

    const options = {
      hostname: 'api.github.com',
      path: `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`,
      method: 'PUT',
      headers: {
        Authorization:   `token ${GITHUB_TOKEN}`,
        'User-Agent':    'GeniusUnleashed-Backend/1.0',
        'Content-Type':  'application/json',
        Accept:          'application/vnd.github.v3+json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', c => (data += c));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(data)); } catch { resolve({}); }
        } else {
          reject(new Error(`GitHub API ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function saveFileToAPI(filePath, content, commitMessage) {
  const sha = await getSHA(filePath);
  return putFile(filePath, content, commitMessage, sha);
}

// ─────────────────────────────────────────────────────────
// MAIN: Archive a message
// Tries local-first, GitHub API as backup.
// ─────────────────────────────────────────────────────────
/**
 * @param {object} message   - Full message object from database
 * @param {'archived'|'completed'} folder
 * @returns {{ jsonPath, mdPath, stem, method }}
 */
async function archiveMessage(message, folder = 'archived') {
  let localResult = null;
  let apiResult   = null;
  let errors      = [];

  // ── STEP 1: Try local file save + git push ──────────────
  try {
    localResult = await archiveLocally(message, folder);
  } catch (err) {
    errors.push(`Local: ${err.message}`);
    console.warn('⚠️  Local archive failed:', err.message);
  }

  // ── STEP 2: Try GitHub API if token is configured ───────
  if (GITHUB_TOKEN && GITHUB_OWNER && GITHUB_REPO) {
    try {
      const stem      = localResult ? localResult.stem : buildStem(message);
      const jsonPath  = `messages/${folder}/${stem}.json`;
      const mdPath    = `messages/${folder}/${stem}.md`;
      const emoji     = folder === 'completed' ? '✅' : '📁';
      const commitBase = `${emoji} ${folder}: ${message.name || 'Unknown'} (${(message.id||'').slice(-6)})`;

      await saveFileToAPI(jsonPath, buildJSON(message, folder),     commitBase);
      await saveFileToAPI(mdPath,   buildMarkdown(message, folder), commitBase);

      apiResult = { stem, jsonPath, mdPath };
      console.log(`✅ GitHub API upload: ${jsonPath}`);
    } catch (err) {
      errors.push(`GitHub API: ${err.message}`);
      console.warn('⚠️  GitHub API archive failed:', err.message);
    }
  }

  if (!localResult && !apiResult) {
    throw new Error(`Archive failed — ${errors.join(' | ')}`);
  }

  const result = localResult || apiResult;
  return { ...result, method: localResult ? 'local+git' : 'github-api' };
}

// ─────────────────────────────────────────────────────────
// List archived files (from GitHub API or local directory)
// ─────────────────────────────────────────────────────────
async function listArchives(folder = 'archived') {
  // Try local directory first
  try {
    const dir   = path.join(MESSAGES_DIR, folder);
    const files = await fs.readdir(dir);
    return files
      .filter(f => f.endsWith('.json') && f !== '.gitkeep')
      .map(f => ({
        name:         f,
        path:         `messages/${folder}/${f}`,
        html_url:     GITHUB_OWNER && GITHUB_REPO
          ? `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/blob/${GITHUB_BRANCH}/messages/${folder}/${f}`
          : null,
        download_url: null,
        size:         null,
        source:       'local'
      }));
  } catch (_) {}

  // Fall back to GitHub API
  return new Promise(resolve => {
    if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) return resolve([]);

    const options = {
      hostname: 'api.github.com',
      path: `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/messages/${folder}?ref=${GITHUB_BRANCH}`,
      method: 'GET',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'User-Agent':  'GeniusUnleashed-Backend/1.0',
        Accept:        'application/vnd.github.v3+json'
      }
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', c => (data += c));
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const files = JSON.parse(data)
              .filter(f => f.name.endsWith('.json'))
              .map(f => ({
                name:         f.name,
                path:         f.path,
                html_url:     f.html_url,
                download_url: f.download_url,
                size:         f.size,
                source:       'github-api'
              }));
            resolve(files);
          } catch { resolve([]); }
        } else {
          resolve([]);
        }
      });
    });
    req.on('error', () => resolve([]));
    req.end();
  });
}

// ─── Download a raw file from any HTTPS URL ───────────────
function fetchURL(url) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path:     parsed.pathname + parsed.search,
      method:   'GET',
      headers: {
        'User-Agent':  'GeniusUnleashed-Backend/1.0',
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept:        'application/vnd.github.v3.raw'
      }
    };

    const req = https.request(options, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchURL(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', c => (data += c));
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.end();
  });
}

// ─── Read a local JSON archive file ───────────────────────
async function readLocalFile(filePath) {
  try {
    const absPath = path.join(REPO_ROOT, filePath);
    const content = await fs.readFile(absPath, 'utf8');
    return content;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────
// Restore archived messages from local files + GitHub
// ─────────────────────────────────────────────────────────
async function restoreFromGitHub(messageDB) {
  let restored = 0;
  let skipped  = 0;
  let errors   = 0;

  for (const folder of ['archived', 'completed']) {
    let files = [];
    try {
      files = await listArchives(folder);
    } catch (err) {
      console.warn(`⚠️  Could not list archives (${folder}):`, err.message);
      continue;
    }

    for (const file of files) {
      try {
        let raw;

        // Try local file first
        if (file.source === 'local') {
          raw = await readLocalFile(file.path);
        }

        // Fall back to GitHub API download
        if (!raw && file.download_url) {
          raw = await fetchURL(file.download_url);
        }

        if (!raw) {
          console.warn(`⚠️  Could not read: ${file.name}`);
          errors++;
          continue;
        }

        const data = JSON.parse(raw);

        if (!data.id || !data.name || !data.email || !data.vision) {
          console.warn(`⚠️  Skipping malformed archive: ${file.name}`);
          errors++;
          continue;
        }

        const existing = await messageDB.getById(data.id);
        if (existing) {
          skipped++;
          continue;
        }

        await messageDB.create({
          id:       data.id,
          name:     data.name,
          email:    data.email,
          vision:   data.vision,
          features: data.features || '',
          discord:  data.discord  || '',
          timeline: data.timeline || '',
          referral: data.referral || '',
          status:   data.status   || folder,
          ts:       data.ts       || Date.now()
        });

        await messageDB.markGithubArchived(
          data.id,
          data.github_path || file.path
        );

        restored++;
        console.log(`✅ Restored: ${data.name} (${data.id})`);
      } catch (err) {
        console.error(`❌ Failed to restore ${file.name}:`, err.message);
        errors++;
      }
    }
  }

  console.log(
    `📥 Restore complete — restored: ${restored}, already in DB: ${skipped}, errors: ${errors}`
  );
  return { restored, skipped, errors };
}

module.exports = { archiveMessage, listArchives, restoreFromGitHub };
