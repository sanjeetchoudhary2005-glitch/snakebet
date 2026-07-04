
import { spawn } from 'child_process';

console.log('Starting npm install with args array...');
const nodePath = 'C:\\Program Files\\nodejs\\node.exe';
const npmCliPath = 'C:\\Program Files\\nodejs\\node_modules\\npm\\bin\\npm-cli.js';
const child = spawn(nodePath, [npmCliPath, 'install'], {
    stdio: 'inherit',
    cwd: process.cwd()
});

child.on('error', (err) => console.error('Install error:', err));
child.on('close', (code) => console.log(`Install done with code ${code}`));
