# 智能任务管理系统 · 开发部署操作手册

> 技术栈：Node.js（后端）+ React（前端）+ Supabase（PostgreSQL 数据库）+ GitHub（代码托管）+ Vercel（部署）
> 教学路径：跑通应用 → 接入数据库 → 上传 GitHub → 部署上线

---

## 一、项目结构

```
task-manager/
├── api/
│   └── index.js          # 后端 API（Express + Supabase），增删改查全部接口
├── src/
│   ├── main.jsx          # React 入口
│   ├── App.jsx           # 主界面：添加/列表/筛选/完成切换/删除
│   └── index.css         # 样式
├── database/
│   └── init.sql          # Supabase 建表 + RLS 策略（第一步就要执行）
├── index.html            # 前端页面模板
├── vite.config.js        # Vite 配置（本地 /api 代理到后端）
├── server.js             # 本地开发启动入口（端口 3001）
├── vercel.json           # Vercel 部署配置
├── package.json          # 依赖与脚本
├── .env.example          # 环境变量示例（复制为 .env 使用）
└── .gitignore            # 已忽略 node_modules / dist / .env
```

## 二、功能清单（与手册一致）

- 顶部输入框写任务标题 + 下拉框选优先级（高/中/低），点"添加"入库
- 任务列表按创建时间倒序显示（最新在最上面）
- 每条任务显示：标题、优先级标签、完成状态
- 每条任务两个按钮：切换完成/未完成、删除
- 已完成任务文字自动加删除线、颜色变淡
- 顶部按优先级筛选：全部/高/中/低
- 数据存在 Supabase 云端数据库，关闭浏览器再打开数据仍在

---

## 三、本地跑通（3 分钟）

### 第 1 步：准备 Supabase 数据库（唯一需要你动手创建的外部服务）

1. 打开 https://supabase.com ，用 GitHub 账号一键登录（免费）
2. 点 **New project** 新建项目：Name 填 `task-manager`，选离你近的区域（如 Southeast Asia），设数据库密码，点 Create
3. 等待 1～2 分钟项目创建完成
4. 左侧菜单 → **SQL Editor** → New query → 把 `database/init.sql` 的内容全部粘贴进去 → **Run**
   - 看到绿色 Success 即建表成功（tasks 表 + 4 条 RLS 策略）

### 第 2 步：配置环境变量

1. 左侧菜单 → **Project Settings** → **API Keys**（或 Data API）
2. 复制两个值：
   - **Project URL**：形如 `https://abcdefghijk.supabase.co`
   - **anon / publishable key**：新版为 `sb_publishable_...` 开头
3. 在项目根目录把 `.env.example` 复制为 `.env`，填入上面两个值：

```env
SUPABASE_URL=https://abcdefghijk.supabase.co
SUPABASE_ANON_KEY=sb_publishable_你的key
```

### 第 3 步：安装依赖并启动

```bash
cd task-manager
npm install
npm run dev
```

- 前端：http://localhost:5173 （浏览器打开这个地址）
- 后端：http://localhost:3001 （自动启动）

**验证**：打开 http://localhost:5173 ，添加几条任务 → 关掉浏览器重开 → 数据还在。

---

## 四、上传 GitHub

```bash
cd task-manager
git init
git add .
git commit -m "init: 智能任务管理系统"
git remote add origin https://github.com/你的用户名/task-manager.git
git branch -M main
git push -u origin main
```

⚠️ 检查：GitHub 仓库页面里**不能出现 .env 文件**（.gitignore 已拦截）。如果不小心传上去了，立即去 Supabase 后台 rotate key。

---

## 五、部署到 Vercel

1. 打开 https://vercel.com ，用 GitHub 账号登录 → **Add New** → **Project**
2. 在 Import Git Repository 列表里找到 `task-manager` 仓库 → **Import**
3. Vercel 会自动识别 Vite 项目，构建配置不用改
4. 在 **Environment Variables** 区域逐条添加（变量名不要改！）：

   | Name | Value |
   | --- | --- |
   | `SUPABASE_URL` | `https://你的项目ID.supabase.co` |
   | `SUPABASE_ANON_KEY` | `sb_publishable_你的key` |

5. 点 **Deploy**，等待 1～3 分钟
6. 部署完成后 Vercel 给你一个域名：`https://task-manager-xxx.vercel.app`，任何人打开都能用

**注意**：Vercel 上的环境变量名必须与 `.env` 完全一致（SUPABASE_URL / SUPABASE_ANON_KEY），这是代码里写死的。

---

## 六、绑定自己的域名（可选）

课程要求域名格式：`姓名的拼音+序号.rangzijigenghao.online`

1. Vercel 项目 → **Settings** → **Domains** → Add
2. 按提示添加两种 DNS 记录（在你的域名服务商后台操作）：
   - **CNAME** 记录 → 指向 `cname.vercel-dns.com`
   - **TXT** 记录 → 按 Vercel 给出的值填写
3. 等待 DNS 生效（几分钟～几小时），访问你的域名即可

---

## 七、接口速查（后端）

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/tasks` | 查询列表，可加 `?priority=高/中/低` |
| POST | `/api/tasks` | 添加任务 `{ "title": "xx", "priority": "高" }` |
| PATCH | `/api/tasks/:id` | 切换完成状态 `{ "completed": true }` |
| DELETE | `/api/tasks/:id` | 删除任务 |

## 八、常见问题（FAQ）

**Q1：添加任务报错 `new row violates row-level security policy`**
→ RLS 策略没执行。回到 SQL Editor，把 `init.sql` 里 4 条 create policy 重新跑一遍。

**Q2：报错 `relation "tasks" does not exist`**
→ 表没建成功。回 SQL Editor 重跑建表 SQL，或在左侧 Table Editor 确认 tasks 表存在。

**Q3：本地接口正常、部署后 500**
→ 检查 Vercel 环境变量：名字是否拼错（SUPABASE_URL / SUPABASE_ANON_KEY）、值是否复制完整。改完点 **Redeploy**。

**Q4：git push 提示要密码 / Permission denied**
→ GitHub 2021 年后不支持账号密码 push：HTTPS 方式会弹出浏览器授权登录，或改用 SSH key。

**Q5：不小心把 .env 传上了 GitHub**
→ 立刻去 Supabase → Project Settings → API Keys → **rotate** 该 key 生成新的；本地删掉 .env，重新 commit + push。

**Q6：Vercel 网址看不到数据，但本地能看到**
→ 两边连的不是同一个 Supabase 项目。核对 Vercel 里 SUPABASE_URL 的项目 ID 与浏览器里 Supabase 地址栏 ID 是否一致。

**Q7：Supabase 提示旧 anon key 要弃用**
→ 旧版 `eyJ...` JWT key 2026 年底停用。去 Project Settings → API Keys 复制新的 `sb_publishable_...`，替换 `.env` 和 Vercel 环境变量即可，代码不用改。

---

## 九、课后拓展（选做）

- 给任务加"截止日期"字段，逾期标红
- 加搜索框按标题模糊搜索
- 加统计面板：总数 / 完成数 / 高优先级剩余数
- 接入 Supabase Auth，RLS 改成"登录用户只能看自己的任务"
- 改一行代码 push 到 GitHub，观察 Vercel 自动重新部署

文档版本：v1.0（由豆包按《练习二》手册生成）
