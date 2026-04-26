import tailwindcss from '@tailwindcss/vite';
import { devtools } from '@tanstack/devtools-vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

function normalizeAssetBaseUrl(value?: string) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return '/';
  }

  // Vite 的 base 需要以 / 结尾，避免拼接 assets 路径时缺少分隔符。
  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
}

const config = defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // 生产构建时可通过 VITE_ASSET_BASE_URL 指定静态资源前缀；本地开发保持根路径。
    base:
      command === 'build'
        ? normalizeAssetBaseUrl(env.VITE_ASSET_BASE_URL)
        : '/',
    plugins: [
      devtools(),
      tsconfigPaths({ projects: ['./tsconfig.json'] }),
      tailwindcss(),
      tanstackRouter({ target: 'react', autoCodeSplitting: true }),
      viteReact(),
    ],
    server: {
      // proxy: {
      //   '/api': 'http://localhost:3100',
      // },
    },
  };
});

export default config;
