import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { checkAuth, jsonResponse, errorResponse } from '@/lib/api-utils';
import { v4 as uuid } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const user = await checkAuth();
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('project_id');
    if (!projectId) return errorResponse('缺少项目ID');

    if (user.role !== 'admin') {
      const member = db.prepare('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?').get(projectId, user.id) as any;
      if (!member || member.role !== 'manager') return errorResponse('只有项目经理可以添加成员', 403);
    }

    const { user_id, role } = await req.json();
    if (!user_id) return errorResponse('请选择成员');

    db.prepare('INSERT OR REPLACE INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)').run(projectId, user_id, role || 'member');

    const addedUser = db.prepare('SELECT name FROM users WHERE id = ?').get(user_id) as any;
    db.prepare('INSERT INTO activities (id, user_id, project_id, action, detail, target_type, target_id) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(uuid(), user.id, projectId, 'added_member', `将 ${addedUser?.name || '新成员'} 加入项目`, 'project', projectId);

    return jsonResponse({ success: true }, 201);
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return errorResponse('请先登录', 401);
    return errorResponse(e.message || '服务器错误', 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await checkAuth();
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('project_id');
    const userId = searchParams.get('user_id');
    if (!projectId || !userId) return errorResponse('参数不完整');

    if (user.role !== 'admin') {
      const member = db.prepare('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?').get(projectId, user.id) as any;
      if (!member || member.role !== 'manager') return errorResponse('权限不足', 403);
    }

    db.prepare('DELETE FROM project_members WHERE project_id = ? AND user_id = ?').run(projectId, userId);
    return jsonResponse({ success: true });
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return errorResponse('请先登录', 401);
    return errorResponse(e.message || '服务器错误', 500);
  }
}
