import { Hono } from 'hono';
import api from './api/route';
import { auth } from './lib/auth';
import { initCors } from './lib/cors';
import { logger } from './lib/logger';
import { requireAuth } from './lib/permission';

const app = new Hono();

// CORS
initCors(app);

app.use('*', logger);

app.use('/api/v1/*', requireAuth);

// 业务路由
const routes = app.route('/api', api);

// better-auth 认证
app.on(['POST', 'GET'], '/api/auth/*', (c) => auth.handler(c.req.raw));

export type AppType = typeof routes;
export default app;
