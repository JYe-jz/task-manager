import { useCallback, useEffect, useState } from 'react';

const PRIORITIES = ['高', '中', '低'];
const FILTERS = ['全部', '高', '中', '低'];

// 优先级标签配色
const PRIORITY_COLOR = {
  '高': '#e5484d',
  '中': '#f5a623',
  '低': '#30a46c'
};

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('中');
  const [filter, setFilter] = useState('全部');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 加载任务列表（按创建时间倒序：最新在最上面）
  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = filter === '全部' ? '' : `?priority=${encodeURIComponent(filter)}`;
      const res = await fetch(`/api/tasks${params}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || '加载任务失败');
      }
      const data = await res.json();
      setTasks(data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // 添加任务
  const handleAdd = async (e) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: cleanTitle, priority })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || '添加任务失败');
      }
      setTitle('');
      await loadTasks();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 切换完成 / 未完成
  const handleToggle = async (task) => {
    setError('');
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.completed })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || '更新任务失败');
      }
      await loadTasks();
    } catch (e) {
      setError(e.message);
    }
  };

  // 删除任务
  const handleDelete = async (id) => {
    setError('');
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || '删除任务失败');
      }
      await loadTasks();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <header className="header">
          <h1>📋 智能任务管理系统</h1>
          <p className="subtitle">添加任务 → 选择优先级 → 管理你的待办清单</p>
        </header>

        {/* 添加任务表单 */}
        <form className="add-form" onSubmit={handleAdd}>
          <input
            className="title-input"
            type="text"
            placeholder="输入任务标题，例如：完成数学作业"
            value={title}
            maxLength={100}
            onChange={(e) => setTitle(e.target.value)}
          />
          <select
            className="priority-select"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                优先级：{p}
              </option>
            ))}
          </select>
          <button className="add-btn" type="submit" disabled={submitting || !title.trim()}>
            {submitting ? '添加中…' : '添加'}
          </button>
        </form>

        {/* 优先级筛选 */}
        <div className="filter-bar">
          <span className="filter-label">筛选：</span>
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
          <span className="task-count">
            {loading ? '加载中…' : `共 ${tasks.length} 条`}
          </span>
        </div>

        {error && <div className="error-banner">⚠️ {error}</div>}

        {/* 任务列表 */}
        <ul className="task-list">
          {!loading && tasks.length === 0 && (
            <li className="empty-tip">
              {filter === '全部' ? '还没有任务，快添加第一条吧！' : `没有「${filter}」优先级的任务`}
            </li>
          )}
          {tasks.map((task) => (
            <li key={task.id} className={`task-item ${task.completed ? 'done' : ''}`}>
              <button
                className={`check-btn ${task.completed ? 'checked' : ''}`}
                title={task.completed ? '标记为未完成' : '标记为已完成'}
                onClick={() => handleToggle(task)}
              >
                {task.completed ? '✓' : ''}
              </button>
              <span className="task-title">{task.title}</span>
              <span className="priority-tag" style={{ backgroundColor: PRIORITY_COLOR[task.priority] || '#888' }}>
                {task.priority}
              </span>
              <button className="delete-btn" title="删除任务" onClick={() => handleDelete(task.id)}>
                删除
              </button>
            </li>
          ))}
        </ul>

        <footer className="footer">
          数据存储在 Supabase 云端数据库，关掉浏览器再打开数据依然存在
        </footer>
      </div>
    </div>
  );
}
