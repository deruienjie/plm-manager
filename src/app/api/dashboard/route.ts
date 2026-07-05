import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { checkAuth, jsonResponse, errorResponse } from '@/lib/api-utils';

export async function GET(_req: NextRequest) {
  try {
    const user = await checkAuth();
    const db = getDb();

    const myTasks = db.prepare(`
      SELECT t.*, p.name as project_name
      FROM tasks t JOIN projects p ON t.project_id = p.id
      WHERE t.assignee_id = ? AND t.status != 'done'
      ORDER BY CASE t.priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 END,
      t.due_date ASC LIMIT 10
    `).all(user.id);

    const myProjects = db.prepare(`
      SELECT p.*, u.name as creator_name,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'done') as done_count
      FROM projects p JOIN project_members pm ON p.id = pm.project_id
      JOIN users u ON p.created_by = u.id
      WHERE pm.user_id = ? AND p.status = 'active'
      ORDER BY p.updated_at DESC
    `).all(user.id);

    const reqStats = db.prepare(`
      SELECT status, COUNT(*) as count FROM requirements
      WHERE project_id IN (SELECT project_id FROM project_members WHERE user_id = ?)
      GROUP BY status
    `).all(user.id);

    const taskStats = db.prepare(`
      SELECT status, COUNT(*) as count FROM tasks
      WHERE project_id IN (SELECT project_id FROM project_members WHERE user_id = ?)
      GROUP BY status
    `).all(user.id);

    const activities = db.prepare(`
      SELECT a.*, u.name as user_name, p.name as project_name
      FROM activities a LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN projects p ON a.project_id = p.id
      WHERE a.project_id IN (SELECT project_id FROM project_members WHERE user_id = ?)
      ORDER BY a.created_at DESC LIMIT 15
    `).all(user.id);

    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    const projectCount = db.prepare('SELECT COUNT(*) as count FROM projects WHERE status = ?').get('active') as { count: number };

    return jsonResponse({
      myTasks, myProjects, reqStats, taskStats, activities,
      stats: { totalUsers: userCount.count, activeProjects: projectCount.count },
    });
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return errorResponse('请先登录', 401);
    return errorResponse(e.message || '服务器错误', 500);
  }
}
