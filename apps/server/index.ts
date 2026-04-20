import { Hono } from 'hono';
import api from './api/route';
import { auth } from './lib/auth';
import { initCors } from './lib/cors';
import { logger } from './lib/logger';
import { requireAuth } from './lib/permission';
import { handle } from 'hono-alibaba-cloud-fc3-adapter';

function createApp() {
  const app = new Hono();

  // CORS
  initCors(app);

  app.use('*', logger);

  app.use('/api/v1/*', requireAuth);

  // 业务路由
  const routes = app.route('/api', api);

  // better-auth 认证

  const appWithAuth = routes.on(['POST', 'GET'], '/api/auth/*', (c) =>
    auth.handler(c.req.raw),
  );
  return appWithAuth;
}

const app = createApp();

export type AppType = typeof app;
export const handler = handle(app);

export default app;
