import { OpenAPIHono } from '@hono/zod-openapi';
import { initOpenAPIRouter } from './api/route';
import { auth } from './lib/auth';
import { initCors } from './lib/cors';

const app = new OpenAPIHono();

// CORS 
initCors(app);

// OpenAPI Router
initOpenAPIRouter(app);
app.on(['POST', 'GET'], '/api/auth/*', (c) => auth.handler(c.req.raw));


export default app;
