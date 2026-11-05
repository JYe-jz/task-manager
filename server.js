/**
 * 本地开发启动入口
 * 运行：npm run dev:server （默认端口 3001，可用 PORT 环境变量修改）
 */
import app from './api/index.js';

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`[task-manager] 后端已启动: http://localhost:${port}`);
  console.log(`[task-manager] 前端开发服务器: http://localhost:5173 （Vite 会把 /api 代理到这里）`);
});
