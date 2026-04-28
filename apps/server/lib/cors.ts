import { trustedOrigins } from '@demo/db/better-auth/auth';
import type { Hono } from 'hono';
import { cors } from 'hono/cors';

export function initCors(app: Hono) {
  app.use(
    // better-auth 接口 /api/auth/*
    // 业务接口 /api/v1/*
    '/api/*',
    cors({
      origin: trustedOrigins,
      allowHeaders: ['Content-Type', 'Authorization'],
      allowMethods: ['POST', 'GET', 'OPTIONS', 'PUT', 'DELETE', 'PATCH'],
      maxAge: 600,
      credentials: true,
    }),
  );
}
