import tailwindcss from '@tailwindcss/vite';
import { devtools } from '@tanstack/devtools-vite';
import viteReact from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

function normalizeAssetBaseUrl(value?: string) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return '/';
  }

  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
}

const config = defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base:
      command === 'build'
        ? normalizeAssetBaseUrl(env.VITE_ASSET_BASE_URL)
        : '/',
    plugins: [
      devtools(),
      tsconfigPaths({ projects: ['./tsconfig.json'] }),
      tailwindcss(),
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
