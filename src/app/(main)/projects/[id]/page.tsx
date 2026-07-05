'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Badge, Modal } from '@/components/ui/common';
import { PROJECT_STATUS, PROJECT_PHASES, REQUIREMENT_STATUS, TASK_STATUS, PRIORITY, formatDate, formatDateTime, timeAgo } from '@/lib/labels';

type Tab = 'overview' | 'requirements' | 'tasks' | 'members' | 'activities';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [showAddReq, setShowAddReq] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showEditProject, setShowEditProject] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  const [reqForm, setReqForm] = useState({ title: '', description: '', priority: 'medium' });
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', assignee_id: '', due_date: '', phase: '' });
  const [memberForm, setMemberForm] = useState({ user_id: '', role: 'member' });
  const [editForm, setEditForm] = useState({ name: '', description: '', status: '', phase: '', progress: 0, start_date: '', end_date: '' });

  const fetchProject = () => {
    fetch(`/api/projects/${params.id}`).then(r => r.json()).then(d => {
      setProject(d);
      setEditForm({
        name: d.name || '', description: d.description || '', status: d.status || 'active',
        phase: d.phase || 'planning', progress: d.progress || 0,
        start_date: d.start_date || '', end_date: d.end_date || '',
      });
      setLoading(false);
    });
  };

  const fetchUsers = async () => {
    const r = await fetch('/api/users');
    const d = await r.json();
    setAllUsers(d.data || []);
  };

  useEffect(() => { fetchProject(); fetchUsers(); }, [params.id]);

  const handleAddReq = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/requirements', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...reqForm, project_id: params.id }),
    });
    if (res.ok) {
      setShowAddReq(false);
      setReqForm({ title: '', description: '', priority: 'medium' });
      fetchProject();
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/tasks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...taskForm, project_id: params.id }),
    });
    if (res.ok) {
      setShowAddTask(false);
      setTaskForm({ title: '', description: '', priority: 'medium', assignee_id: '', due_date: '', phase: '' });
      fetchProject();
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/projects/members?project_id=${params.id}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(memberForm),
    });
    if (res.ok) {
      setShowAddMember(false);
      setMemberForm({ user_id: '', role: 'member' });
      fetchProject();
    }
  };

  const handleEditProject = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/projects/${params.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    setShowEditProject(false);
    fetchProject();
  };

  const handleTaskStatus = async (taskId: string, newStatus: string) => {
    await fetch(`/api/tasks?id=${taskId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchProject();
  };

  const handleReqStatus = async (reqId: string, newStatus: string) => {
    await fetch(`/api/requirements/${reqId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchProject();
  };

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'overview', label: '概览' },
    { key: 'requirements', label: '需求', count: project?.requirements?.length },
    { key: 'tasks', label: '任务', count: project?.tasks?.length },
    { key: 'members', label: '成员', count: project?.members?.length },
    { key: 'activities', label: '动态' },
  ];

  if (loading) return (
    <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
  );

  if (!project || project.error) return (
    <div className="text-center py-20">
      <p className="text-gray-500 mb-4">{project?.error || '项目不存在'}</p>
      <Button onClick={() => router.push('/projects')}>返回项目列表</Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">{project.name}</h2>
              <Badge variant={PROJECT_STATUS[project.status]?.variant || 'default'}>{PROJECT_STATUS[project.status]?.label}</Badge>
              <Badge variant="info">{PROJECT_PHASES[project.phase] || project.phase}</Badge>
            </div>
            <p className="text-gray-500 text-sm">{project.description || '暂无描述'}</p>
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
              <span>创建人：{project.creator_name}</span>
              {project.start_date && <span>周期：{formatDate(project.start_date)} ~ {formatDate(project.end_date)}</span>}
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setShowEditProject(true)}>编辑项目</Button>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-500">项目进度</span>
              <span className="font-medium text-gray-700">{project.progress || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-blue-500 h-2.5 rounded-full transition-all" style={{ width: `${project.progress || 0}%` }} />
            </div>
          </div>
          <div className="flex gap-6 text-sm">
            <div className="text-center"><p className="font-semibold text-gray-900">{project.tasks?.length || 0}</p><p className="text-gray-400 text-xs">总任务</p></div>
            <div className="text-center"><p className="font-semibold text-green-600">{project.tasks?.filter((t: any) => t.status === 'done').length || 0}</p><p className="text-gray-400 text-xs">已完成</p></div>
            <div className="text-center"><p className="font-semibold text-gray-900">{project.requirements?.length || 0}</p><p className="text-gray-400 text-xs">需求</p></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="border-b px-4 flex items-center gap-1">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && <span className="ml-1.5 text-xs bg-gray-100 px-1.5 py-0.5 rounded">{tab.count}</span>}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">最近需求</h4>
                <div className="space-y-2">
                  {project.requirements?.slice(0, 5).map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{r.title}</p>
                        <p className="text-xs text-gray-400">{r.submitter_name} · {timeAgo(r.created_at)}</p>
                      </div>
                      <Badge variant={REQUIREMENT_STATUS[r.status]?.variant || 'default'}>
                        {REQUIREMENT_STATUS[r.status]?.label}
                      </Badge>
                    </div>
                  ))}
                  {(!project.requirements || project.requirements.length === 0) && (
                    <p className="text-sm text-gray-400 py-4 text-center">暂无需求</p>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-3">最近任务</h4>
                <div className="space-y-2">
                  {project.tasks?.slice(0, 5).map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{t.title}</p>
                        <p className="text-xs text-gray-400">{t.assignee_name || '未指派'} · {t.due_date ? formatDate(t.due_date) : '无截止日期'}</p>
                      </div>
                      <Badge variant={TASK_STATUS[t.status]?.variant || 'default'}>
                        {TASK_STATUS[t.status]?.label}
                      </Badge>
                    </div>
                  ))}
                  {(!project.tasks || project.tasks.length === 0) && (
                    <p className="text-sm text-gray-400 py-4 text-center">暂无任务</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Requirements Tab */}
          {activeTab === 'requirements' && (
            <div>
              <div className="flex justify-end mb-4">
                <Button size="sm" onClick={() => setShowAddReq(true)}>+ 提需求</Button>
              </div>
              {project.requirements?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-3 font-medium text-gray-500">需求标题</th>
                        <th className="pb-3 font-medium text-gray-500">优先级</th>
                        <th className="pb-3 font-medium text-gray-500">状态</th>
                        <th className="pb-3 font-medium text-gray-500">提交人</th>
                        <th className="pb-3 font-medium text-gray-500">负责人</th>
                        <th className="pb-3 font-medium text-gray-500">时间</th>
                        <th className="pb-3 font-medium text-gray-500">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {project.requirements.map((r: any) => (
                        <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="py-3 pr-4">
                            <p className="font-medium text-gray-900">{r.title}</p>
                            {r.description && <p className="text-xs text-gray-400 truncate max-w-xs mt-0.5">{r.description}</p>}
                          </td>
                          <td className="py-3"><Badge variant={PRIORITY[r.priority]?.variant || 'default'}>{PRIORITY[r.priority]?.label}</Badge></td>
                          <td className="py-3">
                            <select
                              value={r.status}
                              onChange={e => handleReqStatus(r.id, e.target.value)}
                              className="text-xs border border-gray-200 rounded px-2 py-1 outline-none"
                            >
                              {Object.entries(REQUIREMENT_STATUS).map(([k, v]) => (
                                <option key={k} value={k}>{v.label}</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-3 text-gray-600">{r.submitter_name}</td>
                          <td className="py-3 text-gray-600">{r.assignee_name || '-'}</td>
                          <td className="py-3 text-gray-400 text-xs">{formatDate(r.created_at)}</td>
                          <td className="py-3">
                            <button onClick={() => handleReqStatus(r.id, 'closed')} className="text-xs text-red-500 hover:text-red-700">关闭</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-400 py-8 text-center">暂无需求，点击右上角提交</p>
              )}
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div>
              <div className="flex justify-end mb-4">
                <Button size="sm" onClick={() => setShowAddTask(true)}>+ 新建任务</Button>
              </div>
              {project.tasks?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-3 font-medium text-gray-500">任务</th>
                        <th className="pb-3 font-medium text-gray-500">优先级</th>
                        <th className="pb-3 font-medium text-gray-500">状态</th>
                        <th className="pb-3 font-medium text-gray-500">负责人</th>
                        <th className="pb-3 font-medium text-gray-500">截止日期</th>
                        <th className="pb-3 font-medium text-gray-500">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {project.tasks.map((t: any) => (
                        <tr key={t.id} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="py-3 pr-4">
                            <p className={`font-medium ${t.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{t.title}</p>
                          </td>
                          <td className="py-3"><Badge variant={PRIORITY[t.priority]?.variant || 'default'}>{PRIORITY[t.priority]?.label}</Badge></td>
                          <td className="py-3">
                            <select
                              value={t.status}
                              onChange={e => handleTaskStatus(t.id, e.target.value)}
                              className="text-xs border border-gray-200 rounded px-2 py-1 outline-none"
                            >
                              {Object.entries(TASK_STATUS).map(([k, v]) => (
                                <option key={k} value={k}>{v.label}</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-3 text-gray-600">{t.assignee_name || '-'}</td>
                          <td className="py-3 text-gray-400 text-xs">{formatDate(t.due_date)}</td>
                          <td className="py-3">
                            <button onClick={async () => {
                              await fetch(`/api/tasks?id=${t.id}`, { method: 'DELETE' });
                              fetchProject();
                            }} className="text-xs text-red-500 hover:text-red-700">删除</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-400 py-8 text-center">暂无任务，点击右上角新建</p>
              )}
            </div>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div>
              <div className="flex justify-end mb-4">
                <Button size="sm" onClick={() => setShowAddMember(true)}>+ 添加成员</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {project.members?.map((m: any) => (
                  <div key={m.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium">
                      {m.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{m.name}</p>
                      <p className="text-xs text-gray-500">{m.department || '-'}</p>
                    </div>
                    <Badge variant={m.project_role === 'manager' ? 'warning' : 'default'}>
                      {m.project_role === 'manager' ? '项目经理' : '成员'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activities Tab */}
          {activeTab === 'activities' && (
            <div className="space-y-3">
              {project.activities?.map((a: any) => (
                <div key={a.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-xs font-medium flex-shrink-0">
                    {a.user_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">{a.user_name}</span>
                      <span className="text-gray-500 ml-1">{a.detail}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(a.created_at)}</p>
                  </div>
                </div>
              ))}
              {(!project.activities || project.activities.length === 0) && (
                <p className="text-sm text-gray-400 py-8 text-center">暂无动态</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Requirement Modal */}
      <Modal open={showAddReq} onClose={() => setShowAddReq(false)} title="提交需求">
        <form onSubmit={handleAddReq} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">需求标题 *</label>
            <input type="text" value={reqForm.title} onChange={e => setReqForm({ ...reqForm, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">详细描述</label>
            <textarea value={reqForm.description} onChange={e => setReqForm({ ...reqForm, description: e.target.value })} rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">优先级</label>
            <select value={reqForm.priority} onChange={e => setReqForm({ ...reqForm, priority: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
              {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowAddReq(false)}>取消</Button>
            <Button type="submit">提交需求</Button>
          </div>
        </form>
      </Modal>

      {/* Add Task Modal */}
      <Modal open={showAddTask} onClose={() => setShowAddTask(false)} title="新建任务">
        <form onSubmit={handleAddTask} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">任务标题 *</label>
            <input type="text" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <textarea value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">优先级</label>
              <select value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">负责人</label>
              <select value={taskForm.assignee_id} onChange={e => setTaskForm({ ...taskForm, assignee_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                <option value="">未指派</option>
                {project.members?.map((m: any) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">截止日期</label>
              <input type="date" value={taskForm.due_date} onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">所属阶段</label>
              <select value={taskForm.phase} onChange={e => setTaskForm({ ...taskForm, phase: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                <option value="">无</option>
                {Object.entries(PROJECT_PHASES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowAddTask(false)}>取消</Button>
            <Button type="submit">创建任务</Button>
          </div>
        </form>
      </Modal>

      {/* Add Member Modal */}
      <Modal open={showAddMember} onClose={() => setShowAddMember(false)} title="添加成员">
        <form onSubmit={handleAddMember} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">选择成员 *</label>
            <select value={memberForm.user_id} onChange={e => setMemberForm({ ...memberForm, user_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" required>
              <option value="">请选择</option>
              {allUsers.filter((u: any) => !project.members?.find((m: any) => m.id === u.id)).map((u: any) => (
                <option key={u.id} value={u.id}>{u.name} ({u.department || '-'})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">项目角色</label>
            <select value={memberForm.role} onChange={e => setMemberForm({ ...memberForm, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
              <option value="member">普通成员</option>
              <option value="manager">项目经理</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowAddMember(false)}>取消</Button>
            <Button type="submit">添加</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Project Modal */}
      <Modal open={showEditProject} onClose={() => setShowEditProject(false)} title="编辑项目">
        <form onSubmit={handleEditProject} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">项目名称</label>
            <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
              <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                {Object.entries(PROJECT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">阶段</label>
              <select value={editForm.phase} onChange={e => setEditForm({ ...editForm, phase: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                {Object.entries(PROJECT_PHASES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">进度 (%)</label>
              <input type="number" min="0" max="100" value={editForm.progress} onChange={e => setEditForm({ ...editForm, progress: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
              <input type="date" value={editForm.start_date} onChange={e => setEditForm({ ...editForm, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
              <input type="date" value={editForm.end_date} onChange={e => setEditForm({ ...editForm, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowEditProject(false)}>取消</Button>
            <Button type="submit">保存修改</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
