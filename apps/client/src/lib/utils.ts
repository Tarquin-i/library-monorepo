import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function trimTrailingSlash(url: string) {
  return url.replace(/\/+$/, '');
}

// 优先使用 Vite 暴露给客户端的 API 基地址；未配置时让调用方自行决定是否回退到相对路径。
export function getServerBaseUrl() {
  const envBaseUrl = import.meta.env.VITE_API_BACKEND_URL?.trim();
  return envBaseUrl ? trimTrailingSlash(envBaseUrl) : '';
}
