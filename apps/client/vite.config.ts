import tailwindcss from '@tailwindcss/vite';
import { devtools } from '@tanstack/devtools-vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// 规范化静态资源基础路径的格式，确保以 / 结尾，避免拼接 assets 路径时缺少分隔符。
function normalizeAssetBaseUrl(value?: string) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return '/';
  }

  // Vite 的 base 需要以 / 结尾，避免拼接 assets 路径时缺少分隔符。
  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
}

const config = defineConfig(({ command }) => {
  const apiBackendUrl =
    process.env.API_BACKEND_URL?.trim() || 'http://localhost:3100';

  return {
    // 生产构建时使用环境变量中的静态资源基础路径，开发时使用根路径获取静态资源。
    base:
      command === 'build'
        ? normalizeAssetBaseUrl(process.env.VITE_ASSET_BASE_URL)
        : '/',
    plugins: [
      devtools(),
      tsconfigPaths({ projects: ['./tsconfig.json'] }),
      tailwindcss(),
      tanstackRouter({ target: 'react', autoCodeSplitting: true }),
      viteReact(),
    ],
    server: {
      // 开发环境下，Vite 代理 /api 请求到后端 API 地址，解决跨域问题；生产环境下，前端函数负责转发 API 请求。
      proxy: {
        '/api': {
          target: apiBackendUrl,
          changeOrigin: true,
        },
      },
    },
  };
});

export default config;
