import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Setup directories for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Neon Client
if (!process.env.DATABASE_URL) {
  console.error('CRITICAL: DATABASE_URL is not set in environment variables!');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

app.use(cors());
app.use(express.json());

// Token Generation and Verification
const JWT_SECRET = process.env.JWT_SECRET || 'artisite-editorial-secret-token-key-321';

function generateToken() {
  const payload = {
    role: 'admin',
    exp: Date.now() + 2 * 60 * 60 * 1000 // 2 hours
  };
  const stringified = JSON.stringify(payload);
  const base64Payload = Buffer.from(stringified).toString('base64');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(base64Payload)
    .digest('hex');
  return `${base64Payload}.${signature}`;
}

function verifyToken(token) {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [base64Payload, signature] = parts;
  
  const expectedSignature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(base64Payload)
    .digest('hex');
    
  if (signature !== expectedSignature) return false;
  
  try {
    const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString('utf8'));
    if (payload.exp < Date.now()) return false;
    return payload.role === 'admin';
  } catch {
    return false;
  }
}

// Authentication Middleware
function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }
  const token = authHeader.split(' ')[1];
  if (!verifyToken(token)) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
  next();
}

// --- API Endpoints ---

// 1. Admin Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }

    // Query case-sensitive "User" table in PostgreSQL by email
    const users = await sql.query('SELECT * FROM "User" WHERE email = $1', [email]);
    
    if (users.length > 0) {
      const user = users[0];
      let isMatch = false;
      try {
        isMatch = await bcrypt.compare(password, user.password);
      } catch (err) {
        // Ignore bcrypt format errors and rely on fallback check below
      }
      
      // Plaintext fallback
      if (!isMatch && password === user.password) {
        isMatch = true;
      }

      if (isMatch) {
        const token = generateToken();
        return res.json({ token, email });
      }
    }

    return res.status(401).json({ error: 'Invalid email or password' });
  } catch (err) {
    console.error('Login authentication failed:', err);
    return res.status(500).json({ error: 'Database authentication error' });
  }
});

// 2. GET all articles
app.get('/api/articles', async (req, res) => {
  try {
    const data = await sql.query('SELECT * FROM articles ORDER BY created_date DESC');
    res.json(data);
  } catch (err) {
    console.error('GET /api/articles failed:', err);
    res.status(500).json({ error: 'Failed to retrieve articles' });
  }
});

// 3. GET single article
app.get('/api/articles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await sql.query('SELECT * FROM articles WHERE id = $1', [id]);
    if (data.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }
    res.json(data[0]);
  } catch (err) {
    console.error('GET /api/articles/:id failed:', err);
    res.status(500).json({ error: 'Failed to retrieve article' });
  }
});

// 4. POST create article (Admin Auth Required)
app.post('/api/articles', adminAuth, async (req, res) => {
  try {
    const { title, content, author_name } = req.body;
    if (!title || !content || !author_name) {
      return res.status(400).json({ error: 'Missing title, content, or author_name' });
    }
    const data = await sql.query(
      'INSERT INTO articles (title, content, author_name, created_date, modified_date) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING *',
      [title, content, author_name]
    );
    res.status(201).json(data[0]);
  } catch (err) {
    console.error('POST /api/articles failed:', err);
    res.status(500).json({ error: 'Failed to create article' });
  }
});

// 5. PUT edit article (Admin Auth Required)
app.put('/api/articles/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, author_name } = req.body;
    if (!title || !content || !author_name) {
      return res.status(400).json({ error: 'Missing title, content, or author_name' });
    }
    const data = await sql.query(
      'UPDATE articles SET title = $1, content = $2, author_name = $3, modified_date = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [title, content, author_name, id]
    );
    if (data.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }
    res.json(data[0]);
  } catch (err) {
    console.error('PUT /api/articles/:id failed:', err);
    res.status(500).json({ error: 'Failed to update article' });
  }
});

// 6. DELETE article (Admin Auth Required)
app.delete('/api/articles/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const data = await sql.query('DELETE FROM articles WHERE id = $1 RETURNING *', [id]);
    if (data.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }
    res.json({ message: 'Article deleted successfully', article: data[0] });
  } catch (err) {
    console.error('DELETE /api/articles/:id failed:', err);
    res.status(500).json({ error: 'Failed to delete article' });
  }
});

// Serve frontend assets in production build
app.use(express.static(path.join(__dirname, 'dist')));
app.use((req, res, next) => {
  if (req.url.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`API Server running securely on http://localhost:${PORT}`);
});
