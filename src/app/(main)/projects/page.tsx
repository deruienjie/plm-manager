'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Badge, Modal, EmptyState } from '@/components/ui/common';
import { PROJECT_STATUS, PROJECT_PHASES, formatDate } from '@/lib/labels';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState({ name: '', description: '', start_date: '', end_date: '' });

  const fetchProjects = () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (search) params.set('search', search);
    fetch(`/api/projects?${params}`).then(r => r.json()).then(d => {
      setProjects(d.data || []);
      setLoading(false);
    });
  };

  useEffect(() => { fetchProjects(); }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProjects();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowCreate(false);
      setForm({ name: '', description: '', start_date: '', end_date: '' });
      fetchProjects();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">项目管理</h2>
        <Button onClick={() => setShowCreate(true)}>+ 新建项目</Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="搜索项目名称..."
            className="flex-1 max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <Button type="submit" variant="secondary" size="sm">搜索</Button>
        </form>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">全部状态</option>
          {Object.entries(PROJECT_STATUS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Project List */}
      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : projects.length === 0 ? (
        <EmptyState title="暂无项目" description="点击右上角按钮创建第一个项目" action={<Button onClick={() => setShowCreate(true)}>新建项目</Button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p: any) => (
            <Link key={p.id} href={`/projects/${p.id}`} className="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-200 transition-all">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900 truncate flex-1">{p.name}</h3>
                <Badge variant={PROJECT_STATUS[p.status]?.variant || 'default'}>{PROJECT_STATUS[p.status]?.label}</Badge>
              </div>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">{p.description || '暂无描述'}</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{PROJECT_PHASES[p.phase] || p.phase}</span>
                  <span>{p.member_count} 人</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${p.progress || 0}%` }} />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">{p.done_count}/{p.task_count} 任务完成</span>
                  <span className="font-medium text-gray-600">{p.progress || 0}%</span>
                </div>
                {p.start_date && (
                  <p className="text-xs text-gray-400">{formatDate(p.start_date)} ~ {formatDate(p.end_date)}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="新建项目">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">项目名称 *</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">项目描述</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
              <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
              <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>取消</Button>
            <Button type="submit">创建项目</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
