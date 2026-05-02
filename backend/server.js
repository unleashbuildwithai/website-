require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { initDatabase, messageDB } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database (async)
initDatabase().catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Strict rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // only 5 login attempts per 15 minutes
  message: 'Too many login attempts, please try again later'
});

// JWT middleware for protected routes
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// ============================================
// PUBLIC ROUTES
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: '🤖 Ardy W API is running' });
});

// Submit new message (public)
app.post('/api/messages', async (req, res) => {
  try {
    const { name, email, vision, features, discord, timeline } = req.body;

    // Validation
    if (!name || !email || !vision) {
      return res.status(400).json({ error: 'Name, email, and vision are required' });
    }

    // Generate unique ID
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const ts = Date.now();

    const message = {
      id,
      name: name.trim(),
      email: email.trim(),
      vision: vision.trim(),
      features: features?.trim() || '',
      discord: discord?.trim() || '',
      timeline: timeline || 'Not specified',
      status: 'new',
      ts
    };

    await messageDB.create(message);

    res.status(201).json({
      success: true,
      message: 'Build request received! I\'ll review and reach out ASAP.',
      id
    });
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ error: 'Failed to submit message' });
  }
});

// ============================================
// ADMIN AUTH ROUTES
// ============================================

// Admin login
app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check credentials
    const ADMIN_USER = process.env.ADMIN_USERNAME || 'Admin';
    const ADMIN_PASS_HASH = process.env.ADMIN_PASSWORD_HASH;

    if (!ADMIN_PASS_HASH) {
      console.error('⚠️  ADMIN_PASSWORD_HASH not set in .env file!');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    if (username !== ADMIN_USER) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, ADMIN_PASS_HASH);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { username, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ============================================
// PROTECTED ADMIN ROUTES
// ============================================

// Get all messages (admin only)
app.get('/api/admin/messages', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;
    const messages = await messageDB.getAll(status || null);
    res.json({ success: true, messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get single message (admin only)
app.get('/api/admin/messages/:id', authenticateToken, async (req, res) => {
  try {
    const message = await messageDB.getById(req.params.id);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    res.json({ success: true, message });
  } catch (error) {
    console.error('Error fetching message:', error);
    res.status(500).json({ error: 'Failed to fetch message' });
  }
});

// Update message status (admin only)
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

// Delete single message (admin only)
app.delete('/api/admin/messages/:id', authenticateToken, async (req, res) => {
  try {
    await messageDB.delete(req.params.id);
    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// Empty trash (admin only)
app.delete('/api/admin/trash', authenticateToken, async (req, res) => {
  try {
    const result = await messageDB.deleteByStatus('trash');
    res.json({ 
      success: true, 
      message: 'Trash emptied',
      deleted: result.changes
    });
  } catch (error) {
    console.error('Error emptying trash:', error);
    res.status(500).json({ error: 'Failed to empty trash' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  🤖 ARDY W API SERVER RUNNING          ║
║  Port: ${PORT}                            ║
║  Environment: ${process.env.NODE_ENV || 'development'}              ║
╚════════════════════════════════════════╝
  `);
});
