# PLM 项目管理系统

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fderuienjie%2Fplm-manager)

公司内部 PLM（Product Lifecycle Management）项目管理系统，支持需求提报、任务跟踪、项目看板等功能。

---

## 🚀 一键部署

点击上方 **Deploy with Vercel** 按钮 → 登录 GitHub/Vercel → 等待 2 分钟 → 自动上线。

> ⚠️ **注意**：Vercel 免费版可正常使用。首次打开页面会初始化数据库，略等几秒即可。

## 快速本地启动

```bash
pnpm install
pnpm dev
# http://localhost:3000
```

## 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |
| 项目经理 | zhangsan | 123456 |
| 普通成员 | lisi | 123456 |

## 技术栈

- **Next.js 14** (App Router)
- **Tailwind CSS** + 自定义 UI 组件
- **SQLite** (better-sqlite3)
- **Recharts** (统计图表)

## 功能模块

| 模块 | 说明 |
|------|------|
| 🏠 **工作台** | 个人待办、项目进度、统计图表、动态时间线 |
| 📋 **项目管理** | 创建/编辑/归档项目、阶段管理、进度追踪 |
| 📝 **需求管理** | 提需求 → 评审 → 开发 → 验收，全流程跟踪 |
| ✅ **任务看板** | Kanban 三列视图（待开始/进行中/已完成） |
| 👥 **成员管理** | 创建用户、管理员/项目经理/成员三级权限 |
| 🔐 **认证系统** | 账号密码登录（已预留微信扫码登录接口） |

## 截图预览

_登录后自动进入工作台，所有功能一目了然。_
