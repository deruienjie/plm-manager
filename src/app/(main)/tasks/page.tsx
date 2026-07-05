'use client';

import { useState, useEffect } from 'react';
import { Button, Badge, Modal } from '@/components/ui/common';
import { PRIORITY, PROJECT_PHASES, formatDate } from '@/lib/labels';

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [projectFilter, setProjectFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [allMembers, setAllMembers] = useState<any[]>([]);

  const [form, setForm] = useState({
    project_id: '', title: '', description: '', priority: 'medium',
    assignee_id: '', due_date: '', phase: '',
  });

  const fetchData = () => {
    const params = new URLSearchParams();
    if (projectFilter) params.set('project_id', projectFilter);
    if (assigneeFilter) params.set('assignee_id', assigneeFilter);
    Promise.all([
      fetch(`/api/tasks?${params}`).then(r => r.json()),
      fetch('/api/projects?pageSize=100').then(r => r.json()),
    ]).then(([taskData, projData]) => {
      setTasks(taskData.data || []);
      setProjects(projData.data || []);
      setLoading(false);
    });
  };

  const fetchMembers = async (projectId: string) => {
    if (!projectId) return;
    const r = await fetch(`/api/users?project_id=${projectId}`);
    const d = await r.json();
    setAllMembers(d.data || []);
  };

  useEffect(() => { fetchData(); }, [projectFilter, assigneeFilter]);
  useEffect(() => { fetchMembers(projectFilter); }, [projectFilter]);

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    await fetch(`/api/tasks?id=${taskId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchData();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/tasks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowCreate(false);
      setForm({ project_id: '', title: '', description: '', priority: 'medium', assignee_id: '', due_date: '', phase: '' });
      fetchData();
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('确定删除此任务？')) return;
    await fetch(`/api/tasks?id=${taskId}`, { method: 'DELETE' });
    fetchData();
  };

  const columns = [
    { key: 'todo', label: '待开始', color: 'bg-gray-100 border-gray-300' },
    { key: 'in_progress', label: '进行中', color: 'bg-yellow-50 border-yellow-300' },
    { key: 'done', label: '已完成', color: 'bg-green-50 border-green-300' },
  ];

  if (loading) return (
    <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">任务看板</h2>
        <Button onClick={() => setShowCreate(true)}>+ 新建任务</Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
          <option value="">全部项目</option>
          {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={assigneeFilter} onChange={e => setAssigneeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
          <option value="">全部负责人</option>
          {allMembers.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <span className="text-sm text-gray-400">共 {tasks.length} 个任务</span>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.key);
          return (
            <div key={col.key} className={`rounded-xl border-2 ${col.color} p-4 min-h-[400px]`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-700">{col.label}</h3>
                <span className="text-xs bg-white px-2 py-0.5 rounded-full font-medium text-gray-500">{colTasks.length}</span>
              </div>
              <div className="space-y-2">
                {colTasks.map(task => (
                  <div key={task.id} className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-medium text-gray-900 flex-1">{task.title}</p>
                      <Badge variant={PRIORITY[task.priority]?.variant || 'default'}>{PRIORITY[task.priority]?.label}</Badge>
                    </div>
                    {task.description && (
                      <p className="text-xs text-gray-400 mb-2 line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div>
                        {task.assignee_name && <span>👤 {task.assignee_name}</span>}
                      </div>
                      {task.due_date && <span>📅 {formatDate(task.due_date)}</span>}
                    </div>
                    <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-100">
                      {col.key !== 'todo' && (
                        <button onClick={() => handleStatusChange(task.id, 'todo')}
                          className="text-xs text-gray-400 hover:text-gray-600 px-1">← 上一步</button>
                      )}
                      {col.key !== 'done' && (
                        <button onClick={() => handleStatusChange(task.id, col.key === 'todo' ? 'in_progress' : 'done')}
                          className="text-xs text-blue-600 hover:text-blue-700 px-1 ml-auto">下一步 →</button>
                      )}
                      {col.key === 'done' && (
                        <button onClick={() => handleDelete(task.id)}
                          className="text-xs text-red-400 hover:text-red-600 px-1 ml-auto">删除</button>
                      )}
                    </div>
                  </div>
                ))}
                {colTasks.length === 0 && (
                  <p className="text-xs text-gray-300 text-center py-8">暂无任务</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Task Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="新建任务">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">所属项目 *</label>
            <select value={form.project_id} onChange={e => { setForm({ ...form, project_id: e.target.value }); fetchMembers(e.target.value); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" required>
              <option value="">请选择项目</option>
              {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">任务标题 *</label>
            <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">优先级</label>
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">负责人</label>
              <select value={form.assignee_id} onChange={e => setForm({ ...form, assignee_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                <option value="">未指派</option>
                {allMembers.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">截止日期</label>
              <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">阶段</label>
              <select value={form.phase} onChange={e => setForm({ ...form, phase: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                <option value="">无</option>
                {Object.entries(PROJECT_PHASES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>取消</Button>
            <Button type="submit">创建任务</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
