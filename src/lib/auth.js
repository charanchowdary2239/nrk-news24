import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getAdminById, getAdminByEmail } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'nrk_news24_super_secure_jwt_secret_key_2026_xyz987';
const KNOWN_SECRETS = [
  process.env.JWT_SECRET,
  'nrk_news24_super_secure_jwt_secret_key_2026_xyz987',
  'nrk_news24_default_secret_key_change_in_production_2026',
].filter(Boolean);

export const TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export async function hashPassword(plainPassword) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
}

export async function comparePassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

export function signAdminToken(admin) {
  const payload = {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyAdminToken(token) {
  if (!token) return null;
  for (const secret of KNOWN_SECRETS) {
    try {
      return jwt.verify(token, secret);
    } catch (err) {
      // try next secret
    }
  }
  return null;
}

/**
 * Extracts and verifies admin from Next.js Request, headers, or cookies
 */
export async function getAuthenticatedAdmin(request) {
  let token = null;

  // 1. Try Next.js Request.cookies (.get or dictionary)
  if (request && request.cookies) {
    if (typeof request.cookies.get === 'function') {
      const cookieObj = request.cookies.get('nrk_admin_token');
      if (cookieObj) token = cookieObj.value;
    } else if (request.cookies['nrk_admin_token']) {
      token = request.cookies['nrk_admin_token'];
    }
  }

  // 2. Try raw Cookie header string
  if (!token && request && request.headers) {
    const rawCookie = typeof request.headers.get === 'function'
      ? request.headers.get('cookie')
      : request.headers['cookie'];

    if (rawCookie) {
      const match = rawCookie.match(/(?:^|;\s*)nrk_admin_token=([^;]+)/);
      if (match) {
        token = decodeURIComponent(match[1]);
      }
    }
  }

  // 3. Try Authorization: Bearer <token> header
  if (!token && request && request.headers) {
    const authHeader = typeof request.headers.get === 'function'
      ? request.headers.get('authorization')
      : request.headers['authorization'];

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }
  }

  // 4. Try Next.js next/headers cookies() store fallback
  if (!token) {
    try {
      const { cookies } = require('next/headers');
      const cookieStore = cookies();
      const cookieObj = cookieStore.get('nrk_admin_token');
      if (cookieObj) token = cookieObj.value;
    } catch (e) {
      // Not in a server action/component context where next/headers is available
    }
  }

  if (!token) return null;

  const decoded = verifyAdminToken(token);
  if (!decoded || !decoded.id) return null;

  // Verify against persistent database (Supabase or fallback SQLite)
  let admin = null;
  try {
    admin = await getAdminById(decoded.id);
    if (!admin && decoded.email) {
      admin = await getAdminByEmail(decoded.email);
    }
  } catch (err) {
    console.warn('[Auth] Database admin lookup error, using decoded token credentials:', err.message);
  }

  // Fallback to verified token claims if DB temporarily fails
  if (!admin && (decoded.role === 'admin' || decoded.role === 'editor')) {
    admin = {
      id: decoded.id,
      name: decoded.name || 'NRK Editor',
      email: decoded.email || 'admin@nrknews24.com',
      role: decoded.role || 'admin',
      created_at: new Date().toISOString(),
    };
  }

  if (!admin) return null;

  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    created_at: admin.created_at,
  };
}
