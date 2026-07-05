
import { spawn } from 'child_process';
import path from 'path';

const nodePath = 'C:\\Program Files\\nodejs\\node.exe';
const prismaCli = path.join('node_modules', '.bin', 'prisma');

console.log('Running prisma generate...');
const child = spawn(nodePath, [prismaCli, 'generate'], {
  stdio: 'inherit',
  cwd: process.cwd()
});

child.on('error', err => console.error('Error:', err));
child.on('close', code => console.log('Done with code', code));
