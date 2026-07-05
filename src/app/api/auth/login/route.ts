import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyPassword, createSession, setSessionCookie, getCurrentUser } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/api-utils';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) return errorResponse('用户名和密码不能为空');

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
    if (!user || !verifyPassword(password, user.password)) {
      return errorResponse('用户名或密码错误', 401);
    }

    const sessionId = createSession(user.id);
    await setSessionCookie(sessionId);

    return jsonResponse({
      user: { id: user.id, username: user.username, name: user.name, email: user.email, avatar: user.avatar, role: user.role, department: user.department },
    });
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return errorResponse('未登录', 401);
  return jsonResponse({ user });
}

export async function DELETE() {
  const db = getDb();
  const user = await getCurrentUser();
  if (user) {
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id);
  }
  const res = jsonResponse({ success: true });
  res.cookies.delete('plm_session');
  return res;
}
