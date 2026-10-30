import jwt from 'jsonwebtoken';
import db from '../config/db.js';

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || req.headers['x-access-token'];
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No authorization token provided.'
      });
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. Malformed authorization token.'
      });
    }

    const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_omnimind_production_grade_change_in_prod_2026';
    const decoded = jwt.verify(token, secret);

    // Verify user exists in database
    const userResult = await db.query('SELECT id, email, full_name, created_at FROM users WHERE id = $1', [decoded.userId]);
    
    if (!userResult.rows || userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token: User account no longer exists.'
      });
    }

    req.user = userResult.rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Session expired. Please log in again.'
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Invalid or forged authentication token.'
    });
  }
}

