
import { spawn } from 'child_process';
import path from 'path';

const nodePath = 'C:\\Program Files\\nodejs\\node.exe';
const prismaMain = path.join('node_modules', 'prisma', 'build', 'index.js');

console.log('Running prisma generate via', prismaMain);
const child = spawn(nodePath, [prismaMain, 'generate'], {
  stdio: 'inherit',
  cwd: process.cwd()
});

child.on('error', err => console.error('Error:', err));
child.on('close', code => console.log('Done with code', code));
