# PLM 项目管理系统

公司内部 PLM（Product Lifecycle Management）项目管理系统，支持需求提报、任务跟踪、项目看板等功能。

## 快速启动

```bash
pnpm install
pnpm dev
# 访问 http://localhost:3000
```

## 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |
| 项目经理 | zhangsan | 123456 |
| 普通成员 | lisi | 123456 |

## 技术栈

- Next.js 14 (App Router)
- Tailwind CSS + 自定义 UI 组件
- SQLite (better-sqlite3)
- Recharts (统计图表)

## 功能模块

- **工作台** - 个人待办、项目进度、统计图表、动态时间线
- **项目管理** - 项目 CRUD、阶段管理、进度追踪
- **需求管理** - 需求提交、状态流转、评论讨论
- **任务看板** - Kanban 三列视图、拖拽变更状态
- **成员管理** - 用户创建、角色分配
- **认证系统** - 账号密码登录（预留微信扫码登录接口）
