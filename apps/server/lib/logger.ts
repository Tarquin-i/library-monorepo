import { format } from 'date-fns';
import { Context, Next } from 'hono';

// 根据状态码返回不同颜色的终端颜色码
const statusColor = (status: number) => {
  if (status < 300) return '\x1b[32m'; // 绿色
  if (status < 400) return '\x1b[36m'; // 青色
  if (status < 500) return '\x1b[33m'; // 黄色
  return '\x1b[31m'; // 红色
};

const reset = '\x1b[0m'; // ANSI 重置码：输出完颜色/样式后恢复默认终端样式
const dim = '\x1b[2m'; // 让文字变得更淡
const bold = '\x1b[1m'; // 文字加粗

// 返回当前时间，格式：MM-DD HH:mm:ss
const timestamp = () => format(new Date(), 'MM-dd HH:mm:ss');

export const logger = async (c: Context, next: Next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  const status = c.res.status;
  const color = statusColor(status);
  // logger 挂在 auth 之前，已认证请求有 user，未认证显示 -
  const uid = c.get('user')?.id ?? '-';

  console.log(
    `${dim}[${timestamp()}]${reset} ` +
      `${bold}${c.req.method}${reset} ` +
      `${dim}${c.req.path}${reset} ` +
      `${color}${status}${reset} ` +
      `${dim}${ms}ms uid:${uid}${reset}`,
  );
};
