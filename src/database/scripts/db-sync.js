#!/usr/bin/env node

/**
 * Script para facilitar la sincronización de la base de datos
 * 
 * Uso:
 * - Para verificar la sincronización: npm run db:check
 * - Para sincronizar la base de datos: npm run db:sync
 */

const { spawn } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
const command = args[0] || 'check';

const scriptMap = {
  'check': 'check-sync.ts',
  'sync': 'sync-database.ts'
};

const scriptFile = scriptMap[command];

if (!scriptFile) {
  console.error('Comando no válido. Usa "check" o "sync"');
  process.exit(1);
}

const scriptPath = path.join(__dirname, scriptFile);

const child = spawn('npx', ['ts-node', '-r', 'tsconfig-paths/register', scriptPath], {
  stdio: 'inherit',
  shell: true
});

child.on('close', (code) => {
  process.exit(code);
});
