import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
export default defineConfig({ plugins: [react()], build: { target: 'chrome120', rollupOptions: { input: { popup: resolve('popup.html'), options: resolve('options.html'), 'service-worker': resolve('src/background/service-worker.ts') }, output: { entryFileNames: '[name].js', chunkFileNames: 'assets/[name]-[hash].js' } } } });
