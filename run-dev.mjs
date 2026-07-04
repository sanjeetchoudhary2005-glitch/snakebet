
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const nextDir = path.join(process.cwd(), '.next');
console.log('Clearing .next directory...');
if (fs.existsSync(nextDir)) {
  fs.rmSync(nextDir, { recursive: true, force: true });
  console.log('.next cleared!');
}

const nextPath = path.resolve('node_modules', 'next', 'dist', 'bin', 'next');

console.log('Starting Next.js path:', nextPath);

const child = spawn('node', [nextPath, 'dev'], {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: {
        ...process.env,
        NODE_ENV: 'development',
        NEXT_SWC_DISABLE: '1',
        NEXT_PRIVATE_TEST_SKIP_BUNDLE_TYPE_CHECK: '1'
    },
});

child.on('error', (err) => {
    console.error('Child process error:', err);
});

child.on('close', (code) => {
    console.log(`Child process exited with code ${code}`);
});
