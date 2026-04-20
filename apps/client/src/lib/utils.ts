import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function trimTrailingSlash(url: string) {
  return url.replace(/\/+$/, '');
}

// 优先使用 Vite 环境变量，未配置时回退到当前站点域名。
export function getServerBaseUrl() {
  const envBaseUrl = import.meta.env.VITE_SERVER_URL?.trim();
  if (envBaseUrl) {
    return trimTrailingSlash(envBaseUrl);
  }
  return '';
}
