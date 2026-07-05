import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { checkAuth, jsonResponse, errorResponse } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  try {
    const user = await checkAuth();
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('project_id');

    let users;
    if (projectId) {
      users = db.prepare(`
        SELECT u.id, u.name, u.username, u.avatar, u.role, u.department, pm.role as project_role
        FROM users u JOIN project_members pm ON u.id = pm.user_id
        WHERE pm.project_id = ?
      `).all(projectId);
    } else {
      if (user.role !== 'admin') return errorResponse('权限不足', 403);
      users = db.prepare('SELECT id, name, username, email, avatar, role, department FROM users ORDER BY name').all();
    }

    return jsonResponse({ data: users });
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return errorResponse('请先登录', 401);
    return errorResponse(e.message || '服务器错误', 500);
  }
}
