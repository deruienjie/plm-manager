import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { checkAuth, jsonResponse, errorResponse } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  try {
    const user = await checkAuth();
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('project_id');

    let where = '';
    const params: any[] = [];

    if (projectId) {
      where = 'WHERE a.project_id = ?';
      params.push(projectId);
    } else if (user.role !== 'admin') {
      where = 'WHERE a.project_id IN (SELECT project_id FROM project_members WHERE user_id = ?)';
      params.push(user.id);
    }

    const activities = db.prepare(`
      SELECT a.*, u.name as user_name, u.avatar as user_avatar, p.name as project_name
      FROM activities a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN projects p ON a.project_id = p.id
      ${where}
      ORDER BY a.created_at DESC
      LIMIT 50
    `).all(...params);

    return jsonResponse({ data: activities });
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return errorResponse('请先登录', 401);
    return errorResponse(e.message || '服务器错误', 500);
  }
}
