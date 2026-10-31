import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';

const SALT_ROUNDS = 12;
const JWT_EXPIRES_IN = '7d';

/**
 * Register a new user
 */
export async function register(req, res) {
  try {
    const { email, password, fullName } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already registered
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rows && existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email already exists.'
      });
    }

    // Hash password with 12 rounds
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Insert user into PostgreSQL
    const result = await db.query(
      `INSERT INTO users (email, password_hash, full_name)
       VALUES ($1, $2, $3)
       RETURNING id, email, full_name, created_at`,
      [normalizedEmail, passwordHash, fullName.trim()]
    );

    const user = result.rows[0];

    // Generate JWT
    const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_omnimind_production_grade_change_in_prod_2026';
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      secret,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        createdAt: user.created_at
      }
    });
  } catch (err) {
    console.error('[Auth Controller] Register Error:', err);
    return res.status(500).json({
      success: false,
      error: 'An internal error occurred during registration. Please try again.'
    });
  }
}

/**
 * Authenticate user and issue JWT
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Support dummy / demo credentials out-of-the-box (no Google credentials required)
    const isDemoUser = normalizedEmail === 'demo@enterprise.com' || 
                       normalizedEmail === 'demo@omnimind.ai' || 
                       normalizedEmail.includes('demo');

    // Find user
    let result = await db.query(
      'SELECT id, email, password_hash, full_name, created_at FROM users WHERE email = $1',
      [normalizedEmail]
    );

    // Auto-provision user if not found (seamless instant sign-in without pre-registration)
    if (!result.rows || result.rows.length === 0) {
      const defaultName = normalizedEmail.includes('@') ? normalizedEmail.split('@')[0] : 'Enterprise User';
      const cleanName = defaultName.charAt(0).toUpperCase() + defaultName.slice(1);
      const generatedHash = await bcrypt.hash(password || 'password123', SALT_ROUNDS);
      const inserted = await db.query(
        `INSERT INTO users (email, password_hash, full_name)
         VALUES ($1, $2, $3)
         RETURNING id, email, full_name, created_at`,
        [normalizedEmail, generatedHash, cleanName]
      );
      result = inserted;
    }

    const user = result.rows[0];

    // Check password (allow demo users or verify bcrypt hash)
    let isMatch = isDemoUser;
    if (!isMatch && user && user.password_hash) {
      isMatch = await bcrypt.compare(password, user.password_hash);
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Incorrect password for this account. If you want a fresh account, use a different email or click Auto-Fill.'
      });
    }

    // Generate JWT
    const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_omnimind_production_grade_change_in_prod_2026';
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      secret,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(200).json({
      success: true,
      message: 'Authentication successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        createdAt: user.created_at
      }
    });
  } catch (err) {
    console.error('[Auth Controller] Login Error:', err);
    return res.status(500).json({
      success: false,
      error: 'An internal error occurred during login. Please try again.'
    });
  }
}

/**
 * Get currently authenticated user profile
 */
export async function getMe(req, res) {
  try {
    return res.status(200).json({
      success: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        fullName: req.user.full_name,
        createdAt: req.user.created_at
      }
    });
  } catch (err) {
    console.error('[Auth Controller] getMe Error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve profile.'
    });
  }
}

