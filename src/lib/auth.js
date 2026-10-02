const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'nrk_news24_default_secret_key_change_in_production_2026';
const TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

async function hashPassword(plainPassword) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
}

async function comparePassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

function signAdminToken(admin) {
  const payload = {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function verifyAdminToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

/**
 * Extracts and verifies admin from Next.js Request or headers
 */
function getAuthenticatedAdmin(request) {
  let token = null;

  // 1. Try Cookie
  if (request.cookies) {
    if (typeof request.cookies.get === 'function') {
      const cookieObj = request.cookies.get('nrk_admin_token');
      if (cookieObj) token = cookieObj.value;
    } else if (request.cookies['nrk_admin_token']) {
      token = request.cookies['nrk_admin_token'];
    }
  }

  // 2. Try Authorization header
  if (!token && request.headers) {
    const authHeader = typeof request.headers.get === 'function' 
      ? request.headers.get('authorization')
      : request.headers['authorization'];
      
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) return null;

  const decoded = verifyAdminToken(token);
  if (!decoded) return null;

  // Verify against database
  const db = getDb();
  const admin = db.prepare('SELECT id, name, email, role, created_at FROM admins WHERE id = ?').get(decoded.id);
  return admin || null;
}

module.exports = {
  hashPassword,
  comparePassword,
  signAdminToken,
  verifyAdminToken,
  getAuthenticatedAdmin,
  TOKEN_MAX_AGE_SECONDS,
};
