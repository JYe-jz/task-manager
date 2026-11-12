/**
 * Vercel Serverless 入口（catch-all）
 * 让 /api/health、/api/tasks、/api/tasks/1 等所有 /api/* 请求都进入同一个 Express 应用。
 * 本地开发不经过此文件，仍由 server.js 启动。
 */
export { default } from './index.js';
