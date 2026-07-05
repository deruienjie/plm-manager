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
    const search = searchParams.get('search');

    let where = '';
    const params: any[] = [];

    if (user.role !== 'admin') {
      where = 'WHERE p.id IN (SELECT project_id FROM project_members WHERE user_id = ?)';
      params.push(user.id);
    } else {
      where = 'WHERE 1=1';
    }

    if (status) { where += ' AND p.status = ?'; params.push(status); }
    if (search) { where += ' AND (p.name LIKE ? OR p.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    const countRow = db.prepare(`SELECT COUNT(*) as total FROM projects p ${where}`).get(...params) as { total: number };
    const projects = db.prepare(`
      SELECT p.*, u.name as creator_name,
        (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'done') as done_count
      FROM projects p JOIN users u ON p.created_by = u.id
      ${where} ORDER BY p.updated_at DESC LIMIT ? OFFSET ?
    `).all(...params, pageSize, offset);

    return jsonResponse({ data: projects, pagination: { page, pageSize, total: countRow.total } });
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return errorResponse('请先登录', 401);
    return errorResponse(e.message || '服务器错误', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await checkAuth();
    const db = getDb();
    const { name, description, start_date, end_date, member_ids } = await req.json();
    if (!name) return errorResponse('项目名称不能为空');

    const id = uuid();
    db.prepare('INSERT INTO projects (id, name, description, start_date, end_date, created_by) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, name, description || '', start_date || null, end_date || null, user.id);
    db.prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)').run(id, user.id, 'manager');

    if (member_ids && Array.isArray(member_ids)) {
      const insertMember = db.prepare('INSERT OR IGNORE INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)');
      for (const mid of member_ids) { if (mid !== user.id) insertMember.run(id, mid, 'member'); }
    }

    db.prepare('INSERT INTO activities (id, user_id, project_id, action, detail, target_type, target_id) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(uuid(), user.id, id, 'created_project', `创建了项目「${name}」`, 'project', id);

    return jsonResponse({ id, name }, 201);
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return errorResponse('请先登录', 401);
    return errorResponse(e.message || '服务器错误', 500);
  }
}
