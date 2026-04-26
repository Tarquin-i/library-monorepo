import type { Hono } from 'hono';
import { cors } from 'hono/cors';
import { trustedOrigins } from './auth';

export function initCors(app: Hono) {
  app.use(
    // better-auth 的 /api/auth/* 也要包括在内
    '/api/*',
    cors({
      origin: trustedOrigins,
      allowHeaders: ['Content-Type', 'Authorization'],
      allowMethods: ['POST', 'GET', 'OPTIONS', 'PUT', 'DELETE', 'PATCH'],
      credentials: true,
    }),
  );
}
