#!/usr/bin/env node

import { build } from 'esbuild';
import { execSync } from 'child_process';

console.log('Building frontend...');
execSync('npx vite build', { stdio: 'inherit' });

console.log('Building backend...');
await build({
  entryPoints: ['server/index.ts'],
  platform: 'node',
  format: 'esm',
  bundle: true,
  outdir: 'dist',
  external: [
    'vite',
    '@vitejs/plugin-react',
    '@replit/vite-plugin-cartographer',
    '@replit/vite-plugin-runtime-error-modal'
  ],
  packages: 'external'
});

// Build production static server separately
await build({
  entryPoints: ['server/production-static.ts'],
  platform: 'node',
  format: 'esm',
  bundle: true,
  outdir: 'dist',
  packages: 'external'
});

console.log('Production build complete');