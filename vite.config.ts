import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  base: '/arkanoid/',
  plugins: [
    checker({
      typescript: true,
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        classic: resolve(__dirname, 'classic.html'),
        infinite: resolve(__dirname, 'infinite.html'),
        stage: resolve(__dirname, 'stage.html'),
      },
    },
  },
});
