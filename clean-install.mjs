
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const nodeModulesPath = path.join(process.cwd(), 'node_modules');
const packageLockPath = path.join(process.cwd(), 'package-lock.json');
console.log('Cleaning up existing dependencies...');
if (fs.existsSync(nodeModulesPath)) {
  console.log('Deleting node_modules...');
  fs.rmSync(nodeModulesPath, { recursive: true, force: true });
}
if (fs.existsSync(packageLockPath)) {
  console.log('Deleting package-lock.json...');
  fs.rmSync(packageLockPath, { force: true });
}
console.log('Done cleaning! Now running npm install...');
const npmCli = path.join('C:\\Program Files\\nodejs', 'node_modules', 'npm', 'bin', 'npm-cli.js');
const child = spawn('C:\\Program Files\\nodejs\\node.exe', [npmCli, 'install'], {
  stdio: 'inherit',
  cwd: process.cwd()
});
child.on('error', (err) => {
  console.error('ERROR during install:', err);
});
child.on('close', (code) => {
  console.log('Install process finished with code', code);
  if (code === 0) {
    console.log('✅ SUCCESS! Dependencies installed! Now we can start the dev server!');
  }
});
