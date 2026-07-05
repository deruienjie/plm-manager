import { NextResponse } from 'next/server';
import { getCurrentUser, User } from '@/lib/auth';

export function jsonResponse(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function checkAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  return user;
}

export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20')));
  return { page, pageSize, offset: (page - 1) * pageSize };
}
