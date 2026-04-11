import { Context, Next } from 'hono';

const statusColor = (status: number) => {
  if (status < 300) return '\x1b[32m';
  if (status < 400) return '\x1b[36m';
  if (status < 500) return '\x1b[33m';
  return '\x1b[31m';
};

const reset = '\x1b[0m';
const dim = '\x1b[2m';
const bold = '\x1b[1m';

// 格式：MM-DD HH:mm:ss
const timestamp = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export const logger = async (c: Context, next: Next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  const status = c.res.status;
  const color = statusColor(status);
  // logger 挂在 auth 之前，已认证请求有 user，未认证显示 -
  const uid = (c.get('user') as { id: string } | undefined)?.id ?? '-';

  console.log(
    `${dim}[${timestamp()}]${reset} ` +
      `${bold}${c.req.method}${reset} ` +
      `${dim}${c.req.path}${reset} ` +
      `${color}${status}${reset} ` +
      `${dim}${ms}ms uid:${uid}${reset}`,
  );
};
