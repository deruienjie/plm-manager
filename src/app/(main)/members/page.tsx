'use client';

import { useState, useEffect } from 'react';
import { Button, Badge, Modal } from '@/components/ui/common';

export default function MembersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', name: '', email: '', role: 'member', department: '' });
  const [error, setError] = useState('');

  const fetchUsers = () => {
    fetch('/api/users').then(r => r.json()).then(d => {
      if (d.data) setUsers(d.data);
      setLoading(false);
    });
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || '创建失败');
      return;
    }
    setShowCreate(false);
    setForm({ username: '', password: '', name: '', email: '', role: 'member', department: '' });
    fetchUsers();
  };

  const roleLabels: Record<string, { label: string; variant: 'warning' | 'info' | 'default' }> = {
    admin: { label: '管理员', variant: 'warning' },
    manager: { label: '项目经理', variant: 'info' },
    member: { label: '成员', variant: 'default' },
  };

  if (loading) return (
    <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">团队成员</h2>
        <Button onClick={() => setShowCreate(true)}>+ 添加成员</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((u: any) => (
          <div key={u.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-lg font-bold">
                {u.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{u.name}</p>
                <p className="text-sm text-gray-500">@{u.username}</p>
              </div>
              <Badge variant={roleLabels[u.role]?.variant || 'default'}>
                {roleLabels[u.role]?.label || u.role}
              </Badge>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>{u.department || '未设置部门'}</span>
              {u.email && <span>{u.email}</span>}
            </div>
          </div>
        ))}
      </div>

      {users.length === 0 && (
        <p className="text-center text-gray-400 py-12">暂无成员数据</p>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="添加成员">
        <form onSubmit={handleCreate} className="space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">用户名 *</label>
              <input type="text" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">密码 *</label>
              <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">姓名 *</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                <option value="member">成员</option>
                <option value="manager">项目经理</option>
                <option value="admin">管理员</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">部门</label>
              <input type="text" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="如：研发部" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>取消</Button>
            <Button type="submit">添加成员</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
