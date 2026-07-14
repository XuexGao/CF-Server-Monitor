#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const distDir = path.join(rootDir, 'dist');

// Load .env file
const envPath = path.join(rootDir, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

console.log('Generating config.json from environment variables...');
fs.ensureDirSync(publicDir);
const apiBase = process.env.API_BASE
  ? process.env.API_BASE.split(',').map(s => s.trim()).filter(Boolean)
  : [];
const title = process.env.TITLE || '';
const backgroundImage = process.env.BACKGROUND_IMAGE || '';
const config = { apiBase, title, backgroundImage };
fs.writeFileSync(
  path.join(publicDir, 'config.json'),
  JSON.stringify(config, null, 2),
  'utf8'
);
console.log('Generated config.json:', JSON.stringify(config));

console.log('Cleaning dist directory...');
if (fs.existsSync(distDir)) {
  fs.removeSync(distDir);
}

console.log('Building theme frontend...');
execSync('npx vite build', { cwd: rootDir, stdio: 'inherit', env: { ...process.env, VITE_BASE: './' } });

console.log('Cleaning unwanted public files from dist...');
if (fs.existsSync(distDir)) {
  const keepFiles = new Set(['favicon.ico', 'config.json', 'index.html']);
  for (const item of fs.readdirSync(distDir)) {
    if (item === 'assets') continue;
    if (keepFiles.has(item)) continue;
    const fullPath = path.join(distDir, item);
    fs.removeSync(fullPath);
    console.log(`  removed: ${item}`);
  }
}

console.log('Build complete!');
