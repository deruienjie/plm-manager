import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { checkAuth, jsonResponse, errorResponse } from '@/lib/api-utils';
import { v4 as uuid } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const admin = await checkAuth();
    if (admin.role !== 'admin') return errorResponse('只有管理员可以创建用户', 403);

    const { username, password, name, email, role, department } = await req.json();
    if (!username || !password || !name) return errorResponse('用户名、密码、姓名为必填项');

    const db = getDb();
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) return errorResponse('用户名已存在');

    const id = uuid();
    db.prepare('INSERT INTO users (id, username, password, name, email, role, department) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, username, hashPassword(password), name, email || null, role || 'member', department || null);

    return jsonResponse({ id, username, name, email, role, department }, 201);
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return errorResponse('请先登录', 401);
    return errorResponse(e.message || '服务器错误', 500);
  }
}
