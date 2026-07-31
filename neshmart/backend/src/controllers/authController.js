const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const PHONE_REGEX = /^254(7|1)[0-9]{8}$/;
const STUDENT_EMAIL_DOMAIN = '@uo-kabianga.ac.ke';

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, isVerifiedStudent: user.is_verified_student },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function sanitizeUser(user) {
  const { password_hash, ...safe } = user;
  return safe;
}

async function register(req, res, next) {
  try {
    const { fullName, phone, email, password, confirmPassword } = req.body;

    if (!fullName || !phone || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    if (!PHONE_REGEX.test(phone)) {
      return res.status(400).json({ error: 'Phone must be in format 2547XXXXXXXX' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR phone = $2',
      [email, phone]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email or phone already exists' });
    }

    const isVerifiedStudent = email.toLowerCase().endsWith(STUDENT_EMAIL_DOMAIN);
    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (full_name, phone, email, password_hash, is_verified_student)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [fullName, phone, email, passwordHash, isVerifiedStudent]
    );

    const user = result.rows[0];
    const token = signToken(user);

    res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user || user.is_banned) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken(user);
    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json({ user: sanitizeUser(result.rows[0]) });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me };
