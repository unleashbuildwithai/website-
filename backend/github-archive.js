/**
 * github-archive.js
 * Saves messages as JSON + Markdown files to the GitHub repository.
 * Uses the GitHub Contents API — no extra npm packages required.
 */

const https = require('https');

const {
  GITHUB_TOKEN,
  GITHUB_OWNER,
  GITHUB_REPO,
  GITHUB_BRANCH = 'main'
} = process.env;

// ─── Low-level: GET a file's SHA (required for updates) ───
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

// ─── Low-level: PUT a file to GitHub ──────────────────────
function putFile(filePath, content, commitMessage, sha) {
  return new Promise((resolve, reject) => {
    if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
      return reject(new Error('GitHub credentials not configured'));
    }

    const body = JSON.stringify({
      message: commitMessage,
      content: Buffer.from(content).toString('base64'),
      branch: GITHUB_BRANCH,
      ...(sha ? { sha } : {})
    });

    const options = {
      hostname: 'api.github.com',
      path: `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`,
      method: 'PUT',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'User-Agent': 'GeniusUnleashed-Backend/1.0',
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github.v3+json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', c => (data += c));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(data)); }
          catch { resolve({}); }
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

// ─── Save one file (get SHA first if it already exists) ───
async function saveFile(filePath, content, commitMessage) {
  const sha = await getSHA(filePath);
  return putFile(filePath, content, commitMessage, sha);
}

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

// ─── Main: archive a message to GitHub ────────────────────
/**
 * @param {object} message  - Full message object from database
 * @param {'archived'|'completed'} folder  - Target folder
 * @returns {{ jsonPath, mdPath, stem }} paths of created files
 */
async function archiveMessage(message, folder = 'archived') {
  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    throw new Error('GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO must be set in .env');
  }

  const stem     = buildStem(message);
  const jsonPath = `messages/${folder}/${stem}.json`;
  const mdPath   = `messages/${folder}/${stem}.md`;

  const emoji      = folder === 'completed' ? '✅' : '📁';
  const commitBase = `${emoji} ${folder}: ${message.name || 'Unknown'} (${(message.id || '').slice(-6)})`;

  await saveFile(jsonPath, buildJSON(message, folder), commitBase);
  await saveFile(mdPath,   buildMarkdown(message, folder), commitBase);

  return { jsonPath, mdPath, stem };
}

// ─── List archived files from GitHub ──────────────────────
async function listArchives(folder = 'archived') {
  return new Promise(resolve => {
    if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) return resolve([]);

    const options = {
      hostname: 'api.github.com',
      path: `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/messages/${folder}?ref=${GITHUB_BRANCH}`,
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
        if (res.statusCode === 200) {
          try {
            const files = JSON.parse(data)
              .filter(f => f.name.endsWith('.json'))
              .map(f => ({
                name:         f.name,
                path:         f.path,
                html_url:     f.html_url,
                download_url: f.download_url,
                size:         f.size
              }));
            resolve(files);
          } catch { resolve([]); }
        } else {
          resolve([]); // folder not yet created — that's fine
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
        'User-Agent':    'GeniusUnleashed-Backend/1.0',
        Authorization:  `token ${GITHUB_TOKEN}`,
        Accept:         'application/vnd.github.v3.raw'
      }
    };

    const req = https.request(options, res => {
      // Handle redirects (GitHub raw sometimes redirects)
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

// ─── Restore all archived messages from GitHub into DB ────
/**
 * Called on server startup. Reads every JSON file from
 * messages/archived/ and messages/completed/ on GitHub,
 * then inserts any records that don't already exist in DB.
 *
 * @param {object} messageDB  - the messageDB object from database.js
 * @returns {{ restored: number, skipped: number }}
 */
async function restoreFromGitHub(messageDB) {
  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    console.log('⚠️  GitHub credentials not set — skipping restore on startup');
    return { restored: 0, skipped: 0 };
  }

  let restored = 0;
  let skipped  = 0;
  let errors   = 0;

  for (const folder of ['archived', 'completed']) {
    let files = [];
    try {
      files = await listArchives(folder);
    } catch (err) {
      console.warn(`⚠️  Could not list GitHub archives (${folder}):`, err.message);
      continue;
    }

    for (const file of files) {
      try {
        const raw  = await fetchURL(file.download_url);
        const data = JSON.parse(raw);

        if (!data.id || !data.name || !data.email || !data.vision) {
          console.warn(`⚠️  Skipping malformed archive: ${file.name}`);
          errors++;
          continue;
        }

        // Skip if already exists in DB
        const existing = await messageDB.getById(data.id);
        if (existing) {
          skipped++;
          continue;
        }

        // Insert into DB
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

        // Mark as backed up so the GH badge shows in inbox
        await messageDB.markGithubArchived(
          data.id,
          data.github_path || file.path
        );

        restored++;
        console.log(`✅ Restored from GitHub: ${data.name} (${data.id})`);
      } catch (err) {
        console.error(`❌ Failed to restore ${file.name}:`, err.message);
        errors++;
      }
    }
  }

  console.log(
    `📥 GitHub restore complete — restored: ${restored}, already in DB: ${skipped}, errors: ${errors}`
  );
  return { restored, skipped, errors };
}

module.exports = { archiveMessage, listArchives, restoreFromGitHub };
