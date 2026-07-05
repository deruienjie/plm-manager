export const REQUIREMENT_STATUS: Record<string, { label: string; variant: 'default' | 'warning' | 'info' | 'success' | 'danger' }> = {
  pending_review: { label: '待评审', variant: 'default' },
  in_review: { label: '评审中', variant: 'warning' },
  approved: { label: '已通过', variant: 'info' },
  rejected: { label: '已驳回', variant: 'danger' },
  in_development: { label: '开发中', variant: 'warning' },
  completed: { label: '已完成', variant: 'success' },
  closed: { label: '已关闭', variant: 'default' },
};

export const TASK_STATUS: Record<string, { label: string; variant: 'default' | 'warning' | 'success' }> = {
  todo: { label: '待开始', variant: 'default' },
  in_progress: { label: '进行中', variant: 'warning' },
  done: { label: '已完成', variant: 'success' },
};

export const PRIORITY: Record<string, { label: string; variant: 'danger' | 'warning' | 'info' | 'default' }> = {
  critical: { label: '紧急', variant: 'danger' },
  high: { label: '高', variant: 'warning' },
  medium: { label: '中', variant: 'info' },
  low: { label: '低', variant: 'default' },
};

export const PROJECT_PHASES: Record<string, string> = {
  planning: '规划阶段',
  design: '设计阶段',
  development: '开发阶段',
  testing: '测试阶段',
  release: '发布阶段',
};

export const PROJECT_STATUS: Record<string, { label: string; variant: 'success' | 'default' | 'danger' }> = {
  active: { label: '进行中', variant: 'success' },
  archived: { label: '已归档', variant: 'default' },
  paused: { label: '已暂停', variant: 'danger' },
};

export function formatDate(dateStr: string | null) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatDateTime(dateStr: string | null) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function timeAgo(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}小时前`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay}天前`;
  return formatDate(dateStr);
}
