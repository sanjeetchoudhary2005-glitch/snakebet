
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const swcDir = path.join('node_modules', '@next', 'swc-win32-x64-msvc');
console.log('Deleting SWC directory:', swcDir);

if (fs.existsSync(swcDir)) {
    fs.rmSync(swcDir, { recursive: true, force: true });
    console.log('SWC dir deleted!');
}

console.log('Reinstalling next...');
const nodePath = 'C:\\Program Files\\nodejs\\node.exe';
const npmCliPath = 'C:\\Program Files\\nodejs\\node_modules\\npm\\bin\\npm-cli.js';
const child = spawn(nodePath, [npmCliPath, 'install', 'next'], {
    cwd: process.cwd()
});

child.stdout.on('data', (data) => {
    process.stdout.write(data);
});

child.stderr.on('data', (data) => {
    process.stderr.write(data);
});

child.on('error', (err) => console.error('Error reinstalling next:', err));
child.on('close', (code) => {
    console.log(`\nReinstall done with code ${code}`);
    if (code === 0) {
        console.log('Now let\'s start the dev server!');
    }
});

