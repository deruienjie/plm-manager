import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';

// Use /tmp on Vercel (serverless), local dir otherwise
const DB_PATH = process.env.VERCEL
  ? '/tmp/plm-data.db'
  : path.join(process.cwd(), 'plm-data.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function initDb() {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      avatar TEXT,
      role TEXT NOT NULL DEFAULT 'member',
      department TEXT,
      wechat_openid TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      phase TEXT NOT NULL DEFAULT 'planning',
      progress INTEGER NOT NULL DEFAULT 0,
      start_date TEXT,
      end_date TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS project_members (
      project_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      joined_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      PRIMARY KEY (project_id, user_id),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS requirements (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT NOT NULL DEFAULT 'medium',
      status TEXT NOT NULL DEFAULT 'pending_review',
      phase TEXT,
      submitter_id TEXT NOT NULL,
      assignee_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
      FOREIGN KEY (submitter_id) REFERENCES users(id),
      FOREIGN KEY (assignee_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      requirement_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'todo',
      priority TEXT NOT NULL DEFAULT 'medium',
      phase TEXT,
      assignee_id TEXT,
      due_date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (requirement_id) REFERENCES requirements(id) ON DELETE SET NULL,
      FOREIGN KEY (assignee_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      project_id TEXT,
      action TEXT NOT NULL,
      detail TEXT,
      target_type TEXT,
      target_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
    CREATE INDEX IF NOT EXISTS idx_requirements_project ON requirements(project_id);
    CREATE INDEX IF NOT EXISTS idx_requirements_status ON requirements(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
    CREATE INDEX IF NOT EXISTS idx_comments_target ON comments(target_type, target_id);
    CREATE INDEX IF NOT EXISTS idx_activities_project ON activities(project_id);
  `);
}

export function seedDb() {
  try {
    const database = getDb();

    const existingUsers = database.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    if (existingUsers.count > 0) return;

  const users = [
    { username: 'admin', password: bcrypt.hashSync('admin123', 10), name: '系统管理员', role: 'admin', department: '技术部' },
    { username: 'zhangsan', password: bcrypt.hashSync('123456', 10), name: '张三', role: 'manager', department: '产品部' },
    { username: 'lisi', password: bcrypt.hashSync('123456', 10), name: '李四', role: 'member', department: '研发部' },
    { username: 'wangwu', password: bcrypt.hashSync('123456', 10), name: '王五', role: 'member', department: '测试部' },
    { username: 'zhaoliu', password: bcrypt.hashSync('123456', 10), name: '赵六', role: 'member', department: '设计部' },
  ];

  const insertUser = database.prepare(
    'INSERT INTO users (id, username, password, name, role, department) VALUES (?, ?, ?, ?, ?, ?)'
  );

  const userIds: string[] = [];
  for (const u of users) {
    const id = uuid();
    userIds.push(id);
    insertUser.run(id, u.username, u.password, u.name, u.role, u.department);
  }

  // Create sample projects
  const projectId1 = uuid();
  const projectId2 = uuid();

  const insertProject = database.prepare(
    'INSERT INTO projects (id, name, description, status, phase, progress, start_date, end_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );

  insertProject.run(projectId1, '智能座舱系统 v2.0', '新一代智能座舱系统的设计与开发，包括中控、仪表盘、HUD等模块', 'active', 'development', 45, '2026-05-01', '2026-12-31', userIds[0]);
  insertProject.run(projectId2, '车联网平台升级', '车联网平台后端架构升级，支持更高并发和实时数据处理', 'active', 'design', 20, '2026-06-15', '2027-03-31', userIds[1]);

  // Add members
  const insertMember = database.prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)');
  insertMember.run(projectId1, userIds[0], 'manager');
  insertMember.run(projectId1, userIds[2], 'member');
  insertMember.run(projectId1, userIds[3], 'member');
  insertMember.run(projectId1, userIds[4], 'member');
  insertMember.run(projectId2, userIds[1], 'manager');
  insertMember.run(projectId2, userIds[2], 'member');
  insertMember.run(projectId2, userIds[0], 'member');

  // Sample requirements
  const insertReq = database.prepare(
    'INSERT INTO requirements (id, project_id, title, description, priority, status, phase, submitter_id, assignee_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );

  const reqIds: string[] = [];
  const reqs = [
    [projectId1, '中控触屏手势交互', '支持多指手势操作，包括捏合缩放、滑动切换等', 'high', 'in_development', 'development', userIds[0], userIds[2]],
    [projectId1, 'HUD导航投影优化', '优化HUD导航信息的投影清晰度和色彩准确性', 'medium', 'pending_review', 'planning', userIds[2], null],
    [projectId1, '语音助手响应速度提升', '将语音助手的响应时间从2s降低到1s以内', 'high', 'approved', 'development', userIds[3], userIds[2]],
    [projectId2, 'API网关统一鉴权', '实现统一的API网关鉴权方案', 'high', 'pending_review', 'design', userIds[1], null],
    [projectId2, '数据实时同步方案', '设计并实现车载终端与服务端的数据实时同步方案', 'critical', 'in_review', 'design', userIds[0], userIds[2]],
  ];

  for (const r of reqs) {
    const id = uuid();
    reqIds.push(id);
    insertReq.run(id, r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7]);
  }

  // Sample tasks
  const insertTask = database.prepare(
    'INSERT INTO tasks (id, project_id, requirement_id, title, description, status, priority, phase, assignee_id, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );

  const tasks = [
    [projectId1, reqIds[0], '手势识别算法优化', '优化多点触控算法，提升响应灵敏度', 'in_progress', 'high', 'development', userIds[2], '2026-07-20'],
    [projectId1, reqIds[0], '触控UI组件开发', '开发可复用的触控交互组件', 'in_progress', 'high', 'development', userIds[4], '2026-07-25'],
    [projectId1, reqIds[2], 'NLP模型升级', '升级语音识别NLP模型版本', 'todo', 'high', 'development', userIds[2], '2026-08-01'],
    [projectId1, null, '系统架构评审', '完成v2.0系统架构评审和文档', 'done', 'medium', 'design', userIds[2], '2026-06-30'],
    [projectId2, null, '技术选型调研', '调研网关方案：Kong vs APISIX', 'in_progress', 'high', 'design', userIds[2], '2026-07-10'],
    [projectId2, reqIds[4], '同步协议设计', '设计数据同步协议 v1.0', 'todo', 'critical', 'design', userIds[2], '2026-07-15'],
  ];

  for (const t of tasks) {
    insertTask.run(uuid(), t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[7], t[8]);
  }

  // Sample activities
  const insertActivity = database.prepare(
    'INSERT INTO activities (id, user_id, project_id, action, detail, target_type, target_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );

  const activities = [
    [userIds[0], projectId1, 'created_project', '创建了项目「智能座舱系统 v2.0」', 'project', projectId1],
    [userIds[2], projectId1, 'submitted_requirement', '提交了需求「中控触屏手势交互」', 'requirement', reqIds[0]],
    [userIds[0], projectId1, 'approved_requirement', '通过了需求「语音助手响应速度提升」', 'requirement', reqIds[2]],
    [userIds[1], projectId2, 'created_project', '创建了项目「车联网平台升级」', 'project', projectId2],
    [userIds[0], projectId2, 'submitted_requirement', '提交了需求「数据实时同步方案」', 'requirement', reqIds[4]],
  ];

  for (const a of activities) {
    insertActivity.run(uuid(), a[0], a[1], a[2], a[3], a[4], a[5]);
  }

  console.log('✓ Database seeded with sample data');
  } catch (e: any) {
    // Database already seeded or other error - ignore
    if (e.code !== 'SQLITE_CONSTRAINT_UNIQUE') {
      console.error('Seed error:', e.message);
    }
  }
}
