const { Pool } = require('pg');

// ─── PostgreSQL connection pool ────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false
});

// ─── Initialize tables and indexes ────────────────────────
async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id            TEXT        PRIMARY KEY,
        name          TEXT        NOT NULL,
        email         TEXT        NOT NULL,
        vision        TEXT        NOT NULL,
        features      TEXT        DEFAULT '',
        discord       TEXT        DEFAULT '',
        timeline      TEXT        DEFAULT '',
        referral      TEXT        DEFAULT '',
        status        TEXT        DEFAULT 'new',
        ts            BIGINT      NOT NULL,
        created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        github_archived BOOLEAN   DEFAULT FALSE,
        github_path   TEXT        DEFAULT NULL
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS failed_logins (
        id          SERIAL      PRIMARY KEY,
        username    TEXT        NOT NULL,
        ip_address  TEXT,
        user_agent  TEXT,
        ts          BIGINT      NOT NULL,
        created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Indexes (IF NOT EXISTS is safe to re-run)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_status    ON messages(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_ts        ON messages(ts DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_failed_ts ON failed_logins(ts DESC)`);

    // ── add missing columns for existing databases ──────────
    await client.query(`
      ALTER TABLE messages
        ADD COLUMN IF NOT EXISTS github_archived BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS github_path     TEXT    DEFAULT NULL
    `).catch(() => {}); // silently skip if already exists (older PG versions)

    console.log('✅ Database initialized successfully');
  } finally {
    client.release();
  }
}

// ─── Message operations ────────────────────────────────────
const messageDB = {

  async getAll(status = null) {
    const { rows } = status
      ? await pool.query('SELECT * FROM messages WHERE status = $1 ORDER BY ts DESC', [status])
      : await pool.query('SELECT * FROM messages ORDER BY ts DESC');
    return rows;
  },

  async getById(id) {
    const { rows } = await pool.query('SELECT * FROM messages WHERE id = $1', [id]);
    return rows[0] || null;
  },

  async create(message) {
    const { id, name, email, vision, features, discord, timeline, referral, status, ts } = message;
    await pool.query(
      `INSERT INTO messages (id, name, email, vision, features, discord, timeline, referral, status, ts)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [id, name, email, vision, features || '', discord || '', timeline || '', referral || '', status || 'new', ts]
    );
    return { id };
  },

  async updateStatus(id, status) {
    await pool.query('UPDATE messages SET status = $1 WHERE id = $2', [status, id]);
    return { changes: 1 };
  },

  // Mark a message as backed up to GitHub
  async markGithubArchived(id, path) {
    await pool.query(
      'UPDATE messages SET github_archived = TRUE, github_path = $1 WHERE id = $2',
      [path, id]
    );
    return { changes: 1 };
  },

  async delete(id) {
    await pool.query('DELETE FROM messages WHERE id = $1', [id]);
    return { changes: 1 };
  },

  async deleteByStatus(status) {
    const result = await pool.query('DELETE FROM messages WHERE status = $1', [status]);
    return { changes: result.rowCount };
  },

  async getCountByStatus(status) {
    const { rows } = await pool.query(
      'SELECT COUNT(*) AS count FROM messages WHERE status = $1',
      [status]
    );
    return parseInt(rows[0]?.count || 0, 10);
  }
};

// ─── Failed login operations ───────────────────────────────
const failedLoginDB = {

  async log(username, ipAddress, userAgent) {
    const ts = Date.now();
    await pool.query(
      `INSERT INTO failed_logins (username, ip_address, user_agent, ts) VALUES ($1,$2,$3,$4)`,
      [username, ipAddress || 'unknown', userAgent || 'unknown', ts]
    );
    return { changes: 1 };
  },

  async getAll() {
    const { rows } = await pool.query(
      'SELECT * FROM failed_logins ORDER BY ts DESC LIMIT 100'
    );
    return rows;
  },

  async getCount() {
    const { rows } = await pool.query('SELECT COUNT(*) AS count FROM failed_logins');
    return parseInt(rows[0]?.count || 0, 10);
  },

  async clearAll() {
    const result = await pool.query('DELETE FROM failed_logins');
    return { changes: result.rowCount };
  }
};

module.exports = { initDatabase, messageDB, failedLoginDB };
