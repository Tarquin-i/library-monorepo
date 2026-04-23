import { Hono } from 'hono';
import { handle } from 'hono-alibaba-cloud-fc3-adapter';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const app = new Hono();

// 使用 __dirname 获取当前目录（CommonJS 兼容）
const STATIC_DIR = __dirname;

// 把字符串结尾连续的 / 全部删掉。
function trimTrailingSlash(url: string) {
  return url.replace(/\/+$/, '');
}

// 后端 API 地址，通过环境变量配置
const API_BACKEND_URL = process.env.VITE_API_BACKEND_URL
  ? trimTrailingSlash(process.env.VITE_API_BACKEND_URL)
  : '';

const mimeTypes: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
};

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return mimeTypes[ext] || 'application/octet-stream';
}

// API 代理：转发 /api 请求到后端
app.all('/api/*', async (c) => {
  console.log('[Proxy] Request received:', c.req.method, c.req.url);

  if (!API_BACKEND_URL) {
    console.log('[Proxy] Error: API_BACKEND_URL not configured');
    return c.json({ error: 'API_BACKEND_URL not configured' }, 500);
  }

  const url = new URL(c.req.url);
  const targetUrl = `${API_BACKEND_URL}${url.pathname}${url.search}`;
  console.log('[Proxy] Target URL:', targetUrl);

  const headers = new Headers(c.req.raw.headers);
  headers.delete('host');
  console.log('[Proxy] Content-Type:', headers.get('content-type'));
  console.log('[Proxy] Content-Length:', headers.get('content-length'));

  try {
    console.log('[Proxy] Forwarding request...');
    const response = await fetch(targetUrl, {
      method: c.req.method,
      headers,
      body:
        c.req.method !== 'GET' && c.req.method !== 'HEAD'
          ? c.req.raw.body
          : undefined,
      // @ts-ignore - duplex is needed for streaming body
      duplex: 'half',
    });

    console.log('[Proxy] Response status:', response.status);

    // 调试：打印所有响应头
    console.log('[Proxy] Response headers:');
    response.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });

    // 特别检查 set-auth-token 头
    const authToken = response.headers.get('set-auth-token');
    if (authToken) {
      console.log(
        '[Proxy] Found set-auth-token:',
        authToken.substring(0, 20) + '...',
      );
    }

    const responseHeaders = new Headers(response.headers);
    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[Proxy] Error:', error);
    return c.json({ error: 'Proxy error', details: String(error) }, 500);
  }
});

// 静态文件服务
app.get('*', async (c) => {
  const urlPath = c.req.path;
  const safePath = urlPath.replace(/^\/+/, '');
  let filePath = path.join(STATIC_DIR, safePath);

  const resolvedPath = path.resolve(filePath);
  if (!resolvedPath.startsWith(STATIC_DIR)) {
    return c.text('Forbidden', 403);
  }

  try {
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
  } catch {
    // 文件不存在，尝试 SPA fallback
  }

  try {
    const content = await fs.readFile(filePath);
    const mimeType = getMimeType(filePath);

    const headers: Record<string, string> = {
      'Content-Type': mimeType,
    };

    if (filePath.includes('/assets/')) {
      headers['Cache-Control'] = 'public, max-age=31536000, immutable';
    }

    return new Response(content, { headers });
  } catch {
    try {
      const indexHtml = await fs.readFile(
        path.join(STATIC_DIR, 'index.html'),
        'utf-8',
      );
      return c.html(indexHtml);
    } catch {
      return c.text('Not Found', 404);
    }
  }
});

export const handler = handle(app);

export default {
  port: Number.parseInt(process.env.CLIENT_PORT || '3000', 10),
  fetch: app.fetch,
};
