/**
 * 智能任务管理系统 - 后端 API
 * Express + @supabase/supabase-js 访问 Supabase 云端 PostgreSQL 数据库
 *
 * 本文件同时用于：
 *  1. 本地开发：node server.js 直接启动
 *  2. Vercel 部署：作为 Serverless Function 由 Vercel 自动调用（默认导出 app）
 *
 * 需要的环境变量（见 .env.example）：
 *  SUPABASE_URL      - 例如 https://你的项目ID.supabase.co
 *  SUPABASE_ANON_KEY - 例如 sb_publishable_你的key
 */
import 'dotenv/config';
import express from 'express';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(express.json());

// 初始化 Supabase 客户端
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[task-manager] 缺少环境变量 SUPABASE_URL / SUPABASE_ANON_KEY，请检查 .env 文件或 Vercel 环境变量配置。');
}

const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder-key');

// ---------- 工具函数 ----------
// 统一错误返回，避免把内部错误细节暴露给前端
function handleError(res, err) {
  console.error('[task-manager] API 错误:', err.message);
  if (/relation "tasks" does not exist/i.test(err.message)) {
    return res.status(500).json({ error: '数据库里还没有 tasks 表，请先在 Supabase SQL Editor 里执行建表 SQL。' });
  }
  if (/row-level security/i.test(err.message)) {
    return res.status(500).json({ error: '触发了行级安全策略（RLS），请先执行 RLS 策略 SQL。' });
  }
  return res.status(500).json({ error: '服务器内部错误：' + err.message });
}

// ---------- 健康检查 ----------
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'task-manager-api' });
});

// ---------- 1. 查询任务列表 ----------
// GET /api/tasks?priority=高|中|低|全部
// 任务按创建时间倒序（最新在最上面）
app.get('/api/tasks', async (req, res) => {
  try {
    const { priority } = req.query;
    let query = supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (priority && priority !== '全部') {
      query = query.eq('priority', priority);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    handleError(res, err);
  }
});

// ---------- 2. 添加任务 ----------
// POST /api/tasks  body: { title, priority }
app.post('/api/tasks', async (req, res) => {
  try {
    const { title, priority } = req.body || {};
    const cleanTitle = typeof title === 'string' ? title.trim() : '';
    if (!cleanTitle) {
      return res.status(400).json({ error: '任务标题不能为空。' });
    }
    const cleanPriority = ['高', '中', '低'].includes(priority) ? priority : '中';

    const { data, error } = await supabase
      .from('tasks')
      .insert({ title: cleanTitle, priority: cleanPriority })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    handleError(res, err);
  }
});

// ---------- 3. 切换完成状态 ----------
// PATCH /api/tasks/:id  body: { completed: true/false }
app.patch('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { completed } = req.body || {};

    const { data, error } = await supabase
      .from('tasks')
      .update({ completed: Boolean(completed) })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: '任务不存在，可能已被删除。' });
    }
    res.json(data);
  } catch (err) {
    handleError(res, err);
  }
});

// ---------- 4. 删除任务 ----------
// DELETE /api/tasks/:id
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.status(204).end();
  } catch (err) {
    handleError(res, err);
  }
});

// 兜底 404
app.use('/api', (req, res) => {
  res.status(404).json({ error: '接口不存在：' + req.method + ' ' + req.originalUrl });
});

export default app;
