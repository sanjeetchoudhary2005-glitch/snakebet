
import { exec } from 'child_process';

console.log('Starting npm install...');
const command = '"C:\\Program Files\\nodejs\\npm.cmd" install';
const child = exec(command, {
    cwd: process.cwd(),
    env: {
        ...process.env,
        PATH: `${process.env.PATH || ''};C:\\Program Files\\nodejs`,
    }
});
child.stdout.on('data', (data) => console.log(data));
child.stderr.on('data', (data) => console.error(data));
child.on('error', (err) => console.error('Install error:', err));
child.on('close', (code) => console.log(`Install done with code ${code}`));
