import { Hono } from 'hono';
import api from './api/route';
import { auth } from './lib/auth';
import { initCors } from './lib/cors';

const app = new Hono();

// CORS
initCors(app);

// 业务路由
const routes = app.route('/api', api);

// better-auth 认证
app.on(['POST', 'GET'], '/api/auth/*', (c) => auth.handler(c.req.raw));

export type AppType = typeof routes;
export default app;
