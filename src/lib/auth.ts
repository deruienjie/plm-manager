import { getDb } from './db';
import { v4 as uuid } from 'uuid';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'plm_session';
const SESSION_EXPIRY_HOURS = 24;

export interface User {
  id: string;
  username: string;
  name: string;
  email: string | null;
  avatar: string | null;
  role: 'admin' | 'manager' | 'member';
  department: string | null;
}

export function createSession(userId: string): string {
  const db = getDb();
  const sessionId = uuid();
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000).toISOString();

  db.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)').run(sessionId, userId, expiresAt);
  return sessionId;
}

export async function setSessionCookie(sessionId: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_EXPIRY_HOURS * 60 * 60,
  });
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const db = getDb();
  const row = db.prepare(`
    SELECT u.id, u.username, u.name, u.email, u.avatar, u.role, u.department
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.id = ? AND s.expires_at > datetime('now', 'localtime')
  `).get(sessionId) as any;

  if (!row) {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
    return null;
  }

  return {
    id: row.id,
    username: row.username,
    name: row.name,
    email: row.email,
    avatar: row.avatar,
    role: row.role,
    department: row.department,
  };
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  return user;
}

export async function requireRole(roles: string[]): Promise<User> {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    throw new Error('FORBIDDEN');
  }
  return user;
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export async function logout() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (sessionId) {
    const db = getDb();
    db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
  }
  cookieStore.delete(SESSION_COOKIE);
}
