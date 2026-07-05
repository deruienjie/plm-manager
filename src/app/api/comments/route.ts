import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { checkAuth, jsonResponse, errorResponse } from '@/lib/api-utils';
import { v4 as uuid } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const user = await checkAuth();
    const db = getDb();
    const { target_type, target_id, content } = await req.json();

    if (!target_type || !target_id || !content) {
      return errorResponse('参数不完整');
    }

    const id = uuid();
    db.prepare(
      'INSERT INTO comments (id, target_type, target_id, user_id, content) VALUES (?, ?, ?, ?, ?)'
    ).run(id, target_type, target_id, user.id, content);

    const targetInfo = db.prepare(
      `SELECT * FROM ${target_type === 'requirement' ? 'requirements' : 'tasks'} WHERE id = ?`
    ).get(target_id) as any;
    if (targetInfo) {
      db.prepare(
        'INSERT INTO activities (id, user_id, project_id, action, detail, target_type, target_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(uuid(), user.id, targetInfo.project_id || null, 'commented',
        `评论了${target_type === 'requirement' ? '需求' : '任务'}「${targetInfo.title}」`,
        target_type, target_id);
    }

    return jsonResponse({ id, content }, 201);
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return errorResponse('请先登录', 401);
    return errorResponse(e.message || '服务器错误', 500);
  }
}
