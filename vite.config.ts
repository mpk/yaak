import react from '@vitejs/plugin-react';
import { internalIpV4 } from 'internal-ip';
import { createRequire } from 'node:module';
import path from 'node:path';
import { defineConfig, normalizePath } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import svgr from 'vite-plugin-svgr';
import topLevelAwait from 'vite-plugin-top-level-await';

const require = createRequire(import.meta.url);
const cMapsDir = normalizePath(
  path.join(path.dirname(require.resolve('pdfjs-dist/package.json')), 'cmaps'),
);
const standardFontsDir = normalizePath(
  path.join(path.dirname(require.resolve('pdfjs-dist/package.json')), 'standard_fonts'),
);

const mobile = !!/android|ios/.exec(process.env.TAURI_ENV_PLATFORM ?? '');

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [
    svgr(),
    react(),
    topLevelAwait(),
    viteStaticCopy({
      targets: [
        { src: cMapsDir, dest: '' },
        { src: standardFontsDir, dest: '' },
      ],
    }),
  ],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: mobile ? '0.0.0.0' : false,
    hmr: mobile
      ? {
          protocol: 'ws',
          host: await internalIpV4(),
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ['**/src-tauri/**', '**/designs/**', '**/plugins/**'],
    },
  },
  envPrefix: ['VITE_', 'TAURI_'],
}));
