import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { checkAuth, jsonResponse, errorResponse } from '@/lib/api-utils';
import { v4 as uuid } from 'uuid';

export async function GET(req: NextRequest) {
  try {
    const user = await checkAuth();
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('project_id');
    const status = searchParams.get('status');
    const assigneeId = searchParams.get('assignee_id');

    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (user.role !== 'admin') {
      where += ' AND t.project_id IN (SELECT project_id FROM project_members WHERE user_id = ?)';
      params.push(user.id);
    }
    if (projectId) { where += ' AND t.project_id = ?'; params.push(projectId); }
    if (status) { where += ' AND t.status = ?'; params.push(status); }
    if (assigneeId) { where += ' AND t.assignee_id = ?'; params.push(assigneeId); }

    const tasks = db.prepare(`
      SELECT t.*, u.name as assignee_name, p.name as project_name, r.title as requirement_title
      FROM tasks t LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN projects p ON t.project_id = p.id LEFT JOIN requirements r ON t.requirement_id = r.id
      ${where} ORDER BY t.created_at DESC
    `).all(...params);

    return jsonResponse({ data: tasks });
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return errorResponse('请先登录', 401);
    return errorResponse(e.message || '服务器错误', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await checkAuth();
    const db = getDb();
    const { project_id, requirement_id, title, description, priority, phase, assignee_id, due_date, status } = await req.json();

    if (!title || !project_id) return errorResponse('任务标题和所属项目不能为空');

    const id = uuid();
    db.prepare('INSERT INTO tasks (id, project_id, requirement_id, title, description, status, priority, phase, assignee_id, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(id, project_id, requirement_id || null, title, description || '', status || 'todo', priority || 'medium', phase || null, assignee_id || null, due_date || null);

    db.prepare('INSERT INTO activities (id, user_id, project_id, action, detail, target_type, target_id) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(uuid(), user.id, project_id, 'created_task', `创建了任务「${title}」`, 'task', id);

    return jsonResponse({ id, title }, 201);
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return errorResponse('请先登录', 401);
    return errorResponse(e.message || '服务器错误', 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await checkAuth();
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      const { tasks: taskList } = await req.json();
      if (taskList && Array.isArray(taskList)) {
        const updateStmt = db.prepare("UPDATE tasks SET status = ?, updated_at = datetime('now','localtime') WHERE id = ?");
        const tx = db.transaction(() => { for (const t of taskList) updateStmt.run(t.status, t.id); });
        tx();
        return jsonResponse({ success: true });
      }
      return errorResponse('缺少任务ID');
    }

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as any;
    if (!task) return errorResponse('任务不存在', 404);

    const { title, description, status, priority, phase, assignee_id, due_date } = await req.json();
    db.prepare(`UPDATE tasks SET title=?, description=?, status=?, priority=?, phase=?, assignee_id=?, due_date=?, updated_at=datetime('now','localtime') WHERE id=?`)
      .run(title || task.title, description !== undefined ? description : task.description,
        status || task.status, priority || task.priority,
        phase !== undefined ? phase : task.phase,
        assignee_id !== undefined ? assignee_id : task.assignee_id,
        due_date !== undefined ? due_date : task.due_date, id);

    if (status && status !== task.status) {
      const labels: Record<string, string> = { todo: '待开始', in_progress: '进行中', done: '已完成' };
      db.prepare('INSERT INTO activities (id, user_id, project_id, action, detail, target_type, target_id) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(uuid(), user.id, task.project_id, 'updated_task_status',
          `将任务「${task.title}」移至${labels[status] || status}`, 'task', id);
    }

    return jsonResponse({ success: true });
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return errorResponse('请先登录', 401);
    return errorResponse(e.message || '服务器错误', 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await checkAuth();
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return errorResponse('缺少任务ID');
    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    return jsonResponse({ success: true });
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return errorResponse('请先登录', 401);
    return errorResponse(e.message || '服务器错误', 500);
  }
}
