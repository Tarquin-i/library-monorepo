import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';

export function initCors(app: OpenAPIHono) {
  app.use(
    '/api/v1/*',
    cors({
      origin: 'http://localhost:3000',
      allowHeaders: ['Content-Type', 'Authorization'],
      allowMethods: ['POST', 'GET', 'OPTIONS', 'PUT', 'DELETE'],
      credentials: true,
      // origin: 'http://localhost:3000',
      // allowHeaders: ['X-Custom-Header', 'Upgrade-Insecure-Requests'],
      // allowMethods: ['POST', 'GET', 'OPTIONS'],
      // exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
    }),
  );
}
