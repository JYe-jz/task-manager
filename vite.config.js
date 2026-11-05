import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite 配置
// - 本地开发：前端跑在 5173 端口，/api 请求自动代理到后端 3001 端口
// - Vercel 部署：前端构建为静态文件，/api 请求由 Vercel Serverless Function 处理，无需额外配置
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001'
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});
