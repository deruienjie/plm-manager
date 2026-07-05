'use client';

import { useState, useEffect } from 'react';
import { Button, Badge, Modal } from '@/components/ui/common';
import { REQUIREMENT_STATUS, PRIORITY, formatDate, formatDateTime } from '@/lib/labels';

export default function RequirementsPage() {
  const [requirements, setRequirements] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [commentText, setCommentText] = useState('');

  const [form, setForm] = useState({ project_id: '', title: '', description: '', priority: 'medium' });

  const fetchData = () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (search) params.set('search', search);
    Promise.all([
      fetch(`/api/requirements?${params}`).then(r => r.json()),
      fetch('/api/projects?pageSize=100').then(r => r.json()),
    ]).then(([reqData, projData]) => {
      setRequirements(reqData.data || []);
      setProjects(projData.data || []);
      setLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, [statusFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/requirements', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowCreate(false);
      setForm({ project_id: '', title: '', description: '', priority: 'medium' });
      fetchData();
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    await fetch(`/api/requirements/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
    });
    fetchData();
  };

  const openDetail = async (reqId: string) => {
    const r = await fetch(`/api/requirements/${reqId}`);
    const d = await r.json();
    setShowDetail(d);
  };

  const handleComment = async () => {
    if (!commentText.trim() || !showDetail) return;
    await fetch('/api/comments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_type: 'requirement', target_id: showDetail.id, content: commentText }),
    });
    setCommentText('');
    openDetail(showDetail.id);
  };

  if (loading) return (
    <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">需求管理</h2>
        <Button onClick={() => setShowCreate(true)}>+ 提交需求</Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <form onSubmit={e => { e.preventDefault(); fetchData(); }} className="flex-1 flex gap-2">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="搜索需求..." className="flex-1 max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          <Button type="submit" variant="secondary" size="sm">搜索</Button>
        </form>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
          <option value="">全部状态</option>
          {Object.entries(REQUIREMENT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Stats */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(REQUIREMENT_STATUS).map(([k, v]) => {
          const count = requirements.filter(r => r.status === k).length;
          return count > 0 ? (
            <button key={k} onClick={() => setStatusFilter(statusFilter === k ? '' : k)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                statusFilter === k ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {v.label} ({count})
            </button>
          ) : null;
        })}
      </div>

      {/* Requirements List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {requirements.length === 0 ? (
          <p className="text-sm text-gray-400 py-12 text-center">暂无需求</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-500">需求标题</th>
                <th className="px-4 py-3 font-medium text-gray-500">所属项目</th>
                <th className="px-4 py-3 font-medium text-gray-500">优先级</th>
                <th className="px-4 py-3 font-medium text-gray-500">状态</th>
                <th className="px-4 py-3 font-medium text-gray-500">提交人</th>
                <th className="px-4 py-3 font-medium text-gray-500">负责人</th>
                <th className="px-4 py-3 font-medium text-gray-500">时间</th>
                <th className="px-4 py-3 font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {requirements.map((r: any) => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <button onClick={() => openDetail(r.id)} className="text-left hover:text-blue-600">
                      <p className="font-medium text-gray-900">{r.title}</p>
                      {r.description && <p className="text-xs text-gray-400 truncate max-w-xs mt-0.5">{r.description}</p>}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{r.project_name || '-'}</td>
                  <td className="px-4 py-3"><Badge variant={PRIORITY[r.priority]?.variant || 'default'}>{PRIORITY[r.priority]?.label}</Badge></td>
                  <td className="px-4 py-3">
                    <select value={r.status} onChange={e => handleStatusChange(r.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded px-2 py-1 outline-none">
                      {Object.entries(REQUIREMENT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{r.submitter_name}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{r.assignee_name || '-'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(r.created_at)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => openDetail(r.id)} className="text-xs text-blue-600 hover:text-blue-700 mr-2">详情</button>
                    <button onClick={() => handleStatusChange(r.id, 'closed')} className="text-xs text-red-500 hover:text-red-700">关闭</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="提交需求">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">所属项目 *</label>
            <select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" required>
              <option value="">请选择项目</option>
              {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">需求标题 *</label>
            <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">详细描述</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">优先级</label>
            <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
              {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>取消</Button>
            <Button type="submit">提交需求</Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal open={!!showDetail} onClose={() => setShowDetail(null)} title="需求详情" maxWidth="max-w-2xl">
        {showDetail && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={PRIORITY[showDetail.priority]?.variant || 'default'}>{PRIORITY[showDetail.priority]?.label}</Badge>
                <Badge variant={REQUIREMENT_STATUS[showDetail.status]?.variant || 'default'}>{REQUIREMENT_STATUS[showDetail.status]?.label}</Badge>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{showDetail.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{showDetail.project_name}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{showDetail.description || '暂无描述'}</p>
            </div>

            <div className="flex gap-6 text-sm text-gray-500">
              <span>提交人：{showDetail.submitter_name}</span>
              <span>负责人：{showDetail.assignee_name || '未指派'}</span>
              <span>创建时间：{formatDateTime(showDetail.created_at)}</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">状态变更</label>
              <select value={showDetail.status} onChange={e => {
                handleStatusChange(showDetail.id, e.target.value);
                setShowDetail({ ...showDetail, status: e.target.value });
              }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                {Object.entries(REQUIREMENT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>

            {/* Comments */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">评论 ({showDetail.comments?.length || 0})</h4>
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {showDetail.comments?.map((c: any) => (
                  <div key={c.id} className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs flex-shrink-0">
                      {c.user_name?.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-lg px-3 py-2">
                        <p className="text-xs font-medium text-gray-700">{c.user_name}</p>
                        <p className="text-sm text-gray-600 mt-0.5">{c.content}</p>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(c.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" value={commentText} onChange={e => setCommentText(e.target.value)}
                  placeholder="输入评论..." onKeyDown={e => e.key === 'Enter' && handleComment()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                <Button size="sm" onClick={handleComment}>发送</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
