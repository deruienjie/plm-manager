import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { checkAuth, jsonResponse, errorResponse } from '@/lib/api-utils';
import { v4 as uuid } from 'uuid';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await checkAuth();
    const db = getDb();
    const { id } = params;

    const project = db.prepare(`
      SELECT p.*, u.name as creator_name FROM projects p JOIN users u ON p.created_by = u.id WHERE p.id = ?
    `).get(id) as any;
    if (!project) return errorResponse('项目不存在', 404);

    if (user.role !== 'admin') {
      const member = db.prepare('SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?').get(id, user.id);
      if (!member) return errorResponse('无权访问此项目', 403);
    }

    const members = db.prepare(`
      SELECT u.id, u.name, u.username, u.avatar, u.role as user_role, u.department, pm.role as project_role
      FROM project_members pm JOIN users u ON pm.user_id = u.id WHERE pm.project_id = ?
    `).all(id);

    const requirements = db.prepare(`
      SELECT r.*, su.name as submitter_name, au.name as assignee_name
      FROM requirements r LEFT JOIN users su ON r.submitter_id = su.id
      LEFT JOIN users au ON r.assignee_id = au.id WHERE r.project_id = ? ORDER BY r.created_at DESC
    `).all(id);

    const tasks = db.prepare(`
      SELECT t.*, u.name as assignee_name
      FROM tasks t LEFT JOIN users u ON t.assignee_id = u.id WHERE t.project_id = ? ORDER BY t.created_at DESC
    `).all(id);

    const activities = db.prepare(`
      SELECT a.*, u.name as user_name, u.avatar as user_avatar
      FROM activities a LEFT JOIN users u ON a.user_id = u.id
      WHERE a.project_id = ? ORDER BY a.created_at DESC LIMIT 20
    `).all(id);

    return jsonResponse({ ...project, members, requirements, tasks, activities });
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return errorResponse('请先登录', 401);
    return errorResponse(e.message || '服务器错误', 500);
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await checkAuth();
    const db = getDb();
    const { id } = params;
    const { name, description, status, phase, progress, start_date, end_date } = await req.json();

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as any;
    if (!project) return errorResponse('项目不存在', 404);

    db.prepare(`UPDATE projects SET name=?, description=?, status=?, phase=?, progress=?, start_date=?, end_date=?, updated_at=datetime('now','localtime') WHERE id=?`)
      .run(name || project.name, description !== undefined ? description : project.description,
        status || project.status, phase || project.phase,
        progress !== undefined ? progress : project.progress,
        start_date !== undefined ? start_date : project.start_date,
        end_date !== undefined ? end_date : project.end_date, id);

    db.prepare('INSERT INTO activities (id, user_id, project_id, action, detail, target_type, target_id) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(uuid(), user.id, id, 'updated_project', '更新了项目信息', 'project', id);

    return jsonResponse({ success: true });
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return errorResponse('请先登录', 401);
    return errorResponse(e.message || '服务器错误', 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await checkAuth();
    if (user.role !== 'admin') return errorResponse('只有管理员可以删除项目', 403);
    const db = getDb();
    db.prepare('DELETE FROM projects WHERE id = ?').run(params.id);
    return jsonResponse({ success: true });
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return errorResponse('请先登录', 401);
    return errorResponse(e.message || '服务器错误', 500);
  }
}
