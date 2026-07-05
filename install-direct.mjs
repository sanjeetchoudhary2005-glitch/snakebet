
import { spawn } from 'child_process';
import path from 'path';

console.log('Starting npm install directly...');
const nodePath = 'C:\\Program Files\\nodejs\\node.exe';
const npmCli = path.join('C:\\Program Files\\nodejs', 'node_modules', 'npm', 'bin', 'npm-cli.js');
console.log('Using npm at', npmCli);

const child = spawn(nodePath, [npmCli, 'install'], {
  cwd: process.cwd(),
  stdio: 'inherit'
});

child.on('error', err => {
  console.error('Install error:', err);
});

child.on('close', code => {
  console.log('Install finished with code', code);
  if (code === 0) {
    console.log('✅ Success! Now we can start dev server!');
  }
});
