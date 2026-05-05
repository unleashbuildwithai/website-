require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');

const { initDatabase, messageDB, failedLoginDB } = require('./database');
const { archiveMessage, listArchives, restoreFromGitHub } = require('./github-archive');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Initialize database + restore from GitHub ────────────
async function startup() {
  await initDatabase();
  // After DB is ready, pull in any archived messages from GitHub
  // that aren't already in the DB (handles cold-start data loss).
  restoreFromGitHub(messageDB).catch(err =>
    console.warn('⚠️  GitHub restore on startup failed:', err.message)
  );
}
startup().catch(err => {
  console.error('Startup failed:', err);
  process.exit(1);
});

// ─── Middleware ────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));
app.use(express.json());

// ─── Rate limiting ─────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later'
});

// ─── JWT middleware ────────────────────────────────────────
function authenticateToken(req, res, next) {
  const token = (req.headers['authorization'] || '').split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// ============================================================
// PUBLIC ROUTES
// ============================================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: '🤖 Ardy W API is running' });
});

// Submit new message (public)
app.post('/api/messages', async (req, res) => {
  try {
    const { name, email, vision, features, discord, timeline, referral } = req.body;

    if (!name || !email || !vision) {
      return res.status(400).json({ error: 'Name, email, and vision are required' });
    }

    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const ts = Date.now();

    const message = {
      id,
      name:     name.trim(),
      email:    email.trim(),
      vision:   vision.trim(),
      features: features?.trim()  || '',
      discord:  discord?.trim()   || '',
      timeline: timeline          || 'Not specified',
      referral: referral?.trim()  || '',
      status:   'new',
      ts
    };

    await messageDB.create(message);

    res.status(201).json({
      success: true,
      message: "Build request received! I'll review and reach out ASAP.",
      id
    });
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ error: 'Failed to submit message' });
  }
});

// ============================================================
// ADMIN AUTH ROUTES
// ============================================================

// Admin login
app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    const ADMIN_USER      = process.env.ADMIN_USERNAME || 'Admin';
    const ADMIN_PASS_HASH = process.env.ADMIN_PASSWORD_HASH;

    if (!ADMIN_PASS_HASH) {
      console.error('⚠️  ADMIN_PASSWORD_HASH not set in .env file!');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    if (username !== ADMIN_USER) {
      await failedLoginDB.log(username, req.ip || 'unknown', req.get('user-agent') || 'unknown');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, ADMIN_PASS_HASH);
    if (!isValid) {
      await failedLoginDB.log(username, req.ip || 'unknown', req.get('user-agent') || 'unknown');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { username, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ success: true, token, message: 'Login successful' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ============================================================
// PROTECTED ADMIN ROUTES
// ============================================================

// Get all messages
app.get('/api/admin/messages', authenticateToken, async (req, res) => {
  try {
    const messages = await messageDB.getAll(req.query.status || null);
    res.json({ success: true, messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get single message
app.get('/api/admin/messages/:id', authenticateToken, async (req, res) => {
  try {
    const message = await messageDB.getById(req.params.id);
    if (!message) return res.status(404).json({ error: 'Message not found' });
    res.json({ success: true, message });
  } catch (error) {
    console.error('Error fetching message:', error);
    res.status(500).json({ error: 'Failed to fetch message' });
  }
});

// Update message status
app.put('/api/admin/messages/:id', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['new', 'accepted', 'archived', 'completed', 'trash'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await messageDB.updateStatus(req.params.id, status);
    res.json({ success: true, message: 'Status updated' });
  } catch (error) {
    console.error('Error updating message:', error);
    res.status(500).json({ error: 'Failed to update message' });
  }
});

// ── NEW: Archive a message to GitHub + update status ────────
app.post('/api/admin/messages/:id/archive-to-github', authenticateToken, async (req, res) => {
  try {
    const { folder = 'archived' } = req.body; // 'archived' or 'completed'

    if (!['archived', 'completed'].includes(folder)) {
      return res.status(400).json({ error: 'folder must be "archived" or "completed"' });
    }

    // 1. Fetch full message from DB
    const message = await messageDB.getById(req.params.id);
    if (!message) return res.status(404).json({ error: 'Message not found' });

    // 2. Save to GitHub
    const { jsonPath, mdPath, stem } = await archiveMessage(message, folder);

    // 3. Mark in DB: update status + set github_archived flag
    await messageDB.updateStatus(req.params.id, folder);
    await messageDB.markGithubArchived(req.params.id, jsonPath);

    res.json({
      success:   true,
      message:   `Message archived to GitHub under messages/${folder}/`,
      jsonPath,
      mdPath,
      stem,
      githubUrl: `https://github.com/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/blob/${process.env.GITHUB_BRANCH || 'main'}/${jsonPath}`
    });
  } catch (error) {
    console.error('GitHub archive error:', error);
    res.status(500).json({ error: error.message || 'Failed to archive to GitHub' });
  }
});

// ── NEW: List GitHub archives ────────────────────────────────
app.get('/api/admin/github-archives', authenticateToken, async (req, res) => {
  try {
    const folder = req.query.folder || 'archived';
    const files  = await listArchives(folder);
    res.json({ success: true, files, folder });
  } catch (error) {
    console.error('Error listing archives:', error);
    res.status(500).json({ error: 'Failed to list archives' });
  }
});

// ── NEW: Manual restore from GitHub (trigger from admin inbox) ─
app.post('/api/admin/restore-from-github', authenticateToken, async (req, res) => {
  try {
    const result = await restoreFromGitHub(messageDB);
    res.json({
      success: true,
      message: `Restore complete — ${result.restored} restored, ${result.skipped} already existed`,
      ...result
    });
  } catch (error) {
    console.error('Manual restore error:', error);
    res.status(500).json({ error: error.message || 'Restore failed' });
  }
});

// Delete single message
app.delete('/api/admin/messages/:id', authenticateToken, async (req, res) => {
  try {
    await messageDB.delete(req.params.id);
    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// Empty trash
app.delete('/api/admin/trash', authenticateToken, async (req, res) => {
  try {
    const result = await messageDB.deleteByStatus('trash');
    res.json({ success: true, message: 'Trash emptied', deleted: result.changes });
  } catch (error) {
    console.error('Error emptying trash:', error);
    res.status(500).json({ error: 'Failed to empty trash' });
  }
});

// Get failed login attempts
app.get('/api/admin/failed-attempts', authenticateToken, async (req, res) => {
  try {
    const attempts = await failedLoginDB.getAll();
    const count    = await failedLoginDB.getCount();
    res.json({ success: true, attempts, count });
  } catch (error) {
    console.error('Error fetching failed attempts:', error);
    res.status(500).json({ error: 'Failed to fetch failed attempts' });
  }
});

// Clear failed login attempts
app.delete('/api/admin/failed-attempts', authenticateToken, async (req, res) => {
  try {
    const result = await failedLoginDB.clearAll();
    res.json({ success: true, message: 'Failed login attempts cleared', deleted: result.changes });
  } catch (error) {
    console.error('Error clearing failed attempts:', error);
    res.status(500).json({ error: 'Failed to clear failed attempts' });
  }
});

// ─── 404 ──────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Endpoint not found' }));

// ─── Error handler ─────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║  🤖 ARDY W API SERVER RUNNING              ║
║  Port    : ${PORT}                             ║
║  Database: PostgreSQL                      ║
║  GitHub  : ${process.env.GITHUB_OWNER || '(not configured)'}/${process.env.GITHUB_REPO || ''}
║  Mode    : ${process.env.NODE_ENV || 'development'}                      ║
╚════════════════════════════════════════════╝
  `);
});
