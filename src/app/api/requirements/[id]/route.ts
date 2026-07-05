import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { checkAuth, jsonResponse, errorResponse } from '@/lib/api-utils';
import { v4 as uuid } from 'uuid';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await checkAuth();
    const db = getDb();

    const requirement = db.prepare(`
      SELECT r.*, su.name as submitter_name, au.name as assignee_name, p.name as project_name
      FROM requirements r LEFT JOIN users su ON r.submitter_id = su.id
      LEFT JOIN users au ON r.assignee_id = au.id LEFT JOIN projects p ON r.project_id = p.id
      WHERE r.id = ?
    `).get(params.id) as any;

    if (!requirement) return errorResponse('需求不存在', 404);

    const comments = db.prepare(`
      SELECT c.*, u.name as user_name, u.avatar as user_avatar
      FROM comments c JOIN users u ON c.user_id = u.id
      WHERE c.target_type = 'requirement' AND c.target_id = ? ORDER BY c.created_at ASC
    `).all(params.id);

    return jsonResponse({ ...requirement, comments });
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
    const { title, description, priority, status, phase, assignee_id, project_id } = await req.json();

    const requirement = db.prepare('SELECT * FROM requirements WHERE id = ?').get(id) as any;
    if (!requirement) return errorResponse('需求不存在', 404);

    const oldStatus = requirement.status;

    db.prepare(`UPDATE requirements SET title=?, description=?, priority=?, status=?, phase=?, assignee_id=?, project_id=?, updated_at=datetime('now','localtime') WHERE id=?`)
      .run(title || requirement.title, description !== undefined ? description : requirement.description,
        priority || requirement.priority, status || requirement.status,
        phase !== undefined ? phase : requirement.phase,
        assignee_id !== undefined ? assignee_id : requirement.assignee_id,
        project_id || requirement.project_id, id);

    if (status && status !== oldStatus) {
      const statusLabels: Record<string, string> = {
        pending_review: '待评审', in_review: '评审中', approved: '已通过',
        rejected: '已驳回', in_development: '开发中', completed: '已完成', closed: '已关闭',
      };
      db.prepare('INSERT INTO activities (id, user_id, project_id, action, detail, target_type, target_id) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(uuid(), user.id, requirement.project_id, 'updated_requirement_status',
          `将需求「${requirement.title}」状态从「${statusLabels[oldStatus] || oldStatus}」改为「${statusLabels[status] || status}」`,
          'requirement', id);
    }

    return jsonResponse({ success: true });
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return errorResponse('请先登录', 401);
    return errorResponse(e.message || '服务器错误', 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await checkAuth();
    const db = getDb();
    const requirement = db.prepare('SELECT * FROM requirements WHERE id = ?').get(params.id) as any;
    if (!requirement) return errorResponse('需求不存在', 404);
    if (user.role !== 'admin' && requirement.submitter_id !== user.id) {
      return errorResponse('只能删除自己提交的需求', 403);
    }
    db.prepare('DELETE FROM requirements WHERE id = ?').run(params.id);
    return jsonResponse({ success: true });
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return errorResponse('请先登录', 401);
    return errorResponse(e.message || '服务器错误', 500);
  }
}
