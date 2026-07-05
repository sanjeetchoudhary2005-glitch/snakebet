
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('Cleaning up...');

if (fs.existsSync('node_modules')) {
  console.log('Deleting node_modules...');
  fs.rmSync('node_modules', { recursive: true, force: true });
}

if (fs.existsSync('package-lock.json')) {
  console.log('Deleting package-lock.json...');
  fs.rmSync('package-lock.json', { force: true });
}

if (fs.existsSync('.next')) {
  console.log('Deleting .next...');
  fs.rmSync('.next', { recursive: true, force: true });
}

const nodePath = 'C:\\Program Files\\nodejs\\node.exe';
const npmCli = path.join('C:\\Program Files\\nodejs', 'node_modules', 'npm', 'bin', 'npm-cli.js');

console.log('Installing dependencies...');
const child = spawn(nodePath, [npmCli, 'install'], {
  stdio: 'inherit',
  cwd: process.cwd()
});

child.on('error', err => console.error('Install error:', err));
child.on('close', code => {
  console.log('Install finished with code', code);
  if (code === 0) {
    console.log('✅ Install complete! Now starting dev server...');
  }
});
