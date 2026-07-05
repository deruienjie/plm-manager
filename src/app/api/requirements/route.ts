import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { checkAuth, jsonResponse, errorResponse, parsePagination } from '@/lib/api-utils';
import { v4 as uuid } from 'uuid';

export async function GET(req: NextRequest) {
  try {
    const user = await checkAuth();
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const { page, pageSize, offset } = parsePagination(searchParams);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const projectId = searchParams.get('project_id');
    const search = searchParams.get('search');

    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (user.role !== 'admin') {
      where += ' AND (r.project_id IN (SELECT project_id FROM project_members WHERE user_id = ?) OR r.project_id IS NULL)';
      params.push(user.id);
    }
    if (status) { where += ' AND r.status = ?'; params.push(status); }
    if (priority) { where += ' AND r.priority = ?'; params.push(priority); }
    if (projectId) { where += ' AND r.project_id = ?'; params.push(projectId); }
    if (search) { where += ' AND (r.title LIKE ? OR r.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    const countRow = db.prepare(`SELECT COUNT(*) as total FROM requirements r ${where}`).get(...params) as { total: number };

    const requirements = db.prepare(`
      SELECT r.*, su.name as submitter_name, au.name as assignee_name, p.name as project_name
      FROM requirements r LEFT JOIN users su ON r.submitter_id = su.id
      LEFT JOIN users au ON r.assignee_id = au.id LEFT JOIN projects p ON r.project_id = p.id
      ${where}
      ORDER BY CASE r.priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 END, r.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, pageSize, offset);

    return jsonResponse({ data: requirements, pagination: { page, pageSize, total: countRow.total } });
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return errorResponse('请先登录', 401);
    return errorResponse(e.message || '服务器错误', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await checkAuth();
    const db = getDb();
    const { project_id, title, description, priority, phase, assignee_id } = await req.json();

    if (!title) return errorResponse('需求标题不能为空');
    if (!project_id) return errorResponse('请选择所属项目');

    const id = uuid();
    db.prepare('INSERT INTO requirements (id, project_id, title, description, priority, phase, submitter_id, assignee_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(id, project_id, title, description || '', priority || 'medium', phase || null, user.id, assignee_id || null);

    db.prepare('INSERT INTO activities (id, user_id, project_id, action, detail, target_type, target_id) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(uuid(), user.id, project_id, 'submitted_requirement', `提交了需求「${title}」`, 'requirement', id);

    return jsonResponse({ id, title }, 201);
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return errorResponse('请先登录', 401);
    return errorResponse(e.message || '服务器错误', 500);
  }
}
