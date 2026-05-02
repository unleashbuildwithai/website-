const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Initialize SQLite database
const db = new sqlite3.Database(path.join(__dirname, 'messages.db'), (err) => {
  if (err) {
    console.error('Database connection error:', err);
  }
});

// Create tables if they don't exist
function initDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          vision TEXT NOT NULL,
          features TEXT,
          discord TEXT,
          timeline TEXT,
          referral TEXT,
          status TEXT DEFAULT 'new',
          ts INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) return reject(err);
      });
      
      db.run('CREATE INDEX IF NOT EXISTS idx_status ON messages(status)', (err) => {
        if (err) return reject(err);
      });
      
      db.run('CREATE INDEX IF NOT EXISTS idx_ts ON messages(ts DESC)', (err) => {
        if (err) return reject(err);
      });
      
      // Failed login attempts table
      db.run(`
        CREATE TABLE IF NOT EXISTS failed_logins (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL,
          ip_address TEXT,
          user_agent TEXT,
          ts INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) return reject(err);
      });
      
      db.run('CREATE INDEX IF NOT EXISTS idx_failed_ts ON failed_logins(ts DESC)', (err) => {
        if (err) return reject(err);
        console.log('✅ Database initialized successfully');
        resolve();
      });
    });
  });
}

// Message operations
const messageDB = {
  // Get all messages (optionally filtered by status)
  getAll(status = null) {
    return new Promise((resolve, reject) => {
      if (status) {
        db.all('SELECT * FROM messages WHERE status = ? ORDER BY ts DESC', [status], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      } else {
        db.all('SELECT * FROM messages ORDER BY ts DESC', (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      }
    });
  },

  // Get single message by ID
  getById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM messages WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  // Create new message
  create(message) {
    return new Promise((resolve, reject) => {
      const { id, name, email, vision, features, discord, timeline, referral, status, ts } = message;
      db.run(
        `INSERT INTO messages (id, name, email, vision, features, discord, timeline, referral, status, ts)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, name, email, vision, features || '', discord || '', timeline || '', referral || '', status || 'new', ts],
        function(err) {
          if (err) reject(err);
          else resolve({ id, changes: this.changes });
        }
      );
    });
  },

  // Update message status
  updateStatus(id, status) {
    return new Promise((resolve, reject) => {
      db.run('UPDATE messages SET status = ? WHERE id = ?', [status, id], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  },

  // Delete message
  delete(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM messages WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  },

  // Delete all messages with specific status (e.g., empty trash)
  deleteByStatus(status) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM messages WHERE status = ?', [status], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  },

  // Get message count by status
  getCountByStatus(status) {
    return new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM messages WHERE status = ?', [status], (err, row) => {
        if (err) reject(err);
        else resolve(row ? row.count : 0);
      });
    });
  }
};

// Failed login operations
const failedLoginDB = {
  // Log a failed login attempt
  log(username, ipAddress, userAgent) {
    return new Promise((resolve, reject) => {
      const ts = Date.now();
      db.run(
        `INSERT INTO failed_logins (username, ip_address, user_agent, ts)
         VALUES (?, ?, ?, ?)`,
        [username, ipAddress || 'unknown', userAgent || 'unknown', ts],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, changes: this.changes });
        }
      );
    });
  },

  // Get all failed login attempts
  getAll() {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM failed_logins ORDER BY ts DESC LIMIT 100', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  // Get count of failed attempts
  getCount() {
    return new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM failed_logins', (err, row) => {
        if (err) reject(err);
        else resolve(row ? row.count : 0);
      });
    });
  },

  // Clear all failed login attempts
  clearAll() {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM failed_logins', function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }
};

module.exports = {
  initDatabase,
  messageDB,
  failedLoginDB
};
