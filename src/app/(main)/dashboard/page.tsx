'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/common';
import { TASK_STATUS, PRIORITY, REQUIREMENT_STATUS, formatDate, timeAgo } from '@/lib/labels';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(d => {
      setData(d);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );

  if (!data) return null;

  const reqChartData = (data.reqStats || []).map((s: any) => ({
    name: REQUIREMENT_STATUS[s.status]?.label || s.status,
    value: s.count,
  }));

  const taskChartData = (data.taskStats || []).map((s: any) => ({
    name: TASK_STATUS[s.status]?.label || s.status,
    value: s.count,
  }));

  const COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#6B7280'];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="进行中项目" value={data.stats?.activeProjects || 0} color="blue" />
        <StatCard label="团队人数" value={data.stats?.totalUsers || 0} color="green" />
        <StatCard label="我的任务" value={(data.myTasks || []).length} color="orange" />
        <StatCard label="待处理需求" value={(data.reqStats || []).filter((s: any) => ['pending_review', 'in_review'].includes(s.status)).reduce((a: number, b: any) => a + b.count, 0)} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Tasks */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">我的待办任务</h3>
            <Link href="/tasks" className="text-sm text-blue-600 hover:text-blue-700">查看全部 →</Link>
          </div>
          {data.myTasks?.length > 0 ? (
            <div className="space-y-3">
              {data.myTasks.map((task: any) => (
                <div key={task.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className={`w-2 h-2 rounded-full ${task.status === 'in_progress' ? 'bg-yellow-400' : 'bg-gray-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                    <p className="text-xs text-gray-500">{task.project_name}</p>
                  </div>
                  <Badge variant={PRIORITY[task.priority]?.variant || 'default'}>{PRIORITY[task.priority]?.label}</Badge>
                  {task.due_date && (
                    <span className="text-xs text-gray-400">{formatDate(task.due_date)}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-8 text-center">暂无待办任务 🎉</p>
          )}
        </div>

        {/* Stats Charts */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">需求状态分布</h3>
          {reqChartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={reqChartData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2} dataKey="value">
                    {reqChartData.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1.5">
                {reqChartData.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-gray-600">{item.name}</span>
                    </div>
                    <span className="font-medium text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400 py-8 text-center">暂无数据</p>
          )}
        </div>
      </div>

      {/* My Projects & Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Projects */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">我的项目</h3>
            <Link href="/projects" className="text-sm text-blue-600 hover:text-blue-700">全部项目 →</Link>
          </div>
          <div className="space-y-3">
            {data.myProjects?.map((p: any) => (
              <Link key={p.id} href={`/projects/${p.id}`} className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {p.done_count}/{p.task_count} 任务完成
                      {p.start_date && ` · ${formatDate(p.start_date)} 起`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${p.progress || 0}%` }} />
                    </div>
                    <span className="text-xs font-medium text-gray-600">{p.progress || 0}%</span>
                  </div>
                </div>
              </Link>
            ))}
            {(!data.myProjects || data.myProjects.length === 0) && (
              <p className="text-sm text-gray-400 py-8 text-center">暂无参与的项目</p>
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">最近动态</h3>
          <div className="space-y-3">
            {data.activities?.map((a: any) => (
              <div key={a.id} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-medium flex-shrink-0 mt-0.5">
                  {a.user_name?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{a.user_name}</span>
                    <span className="text-gray-500 ml-1">{a.detail}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{timeAgo(a.created_at)}</p>
                </div>
              </div>
            ))}
            {(!data.activities || data.activities.length === 0) && (
              <p className="text-sm text-gray-400 py-8 text-center">暂无动态</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{label}</p>
        <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center`}>
          <span className="text-lg font-bold">{value}</span>
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}
