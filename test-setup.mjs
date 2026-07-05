
import fs from 'fs';
import path from 'path';

console.log('Current directory:', process.cwd());
console.log('Files in directory:', fs.readdirSync('.'));

const pkgJsonPath = path.resolve('package.json');
console.log('Package JSON exists:', fs.existsSync(pkgJsonPath));

if (fs.existsSync(pkgJsonPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
    console.log('Package JSON contents:', pkg);
}

const nodeModulesPath = path.resolve('node_modules');
console.log('node_modules exists:', fs.existsSync(nodeModulesPath));

const binPath = path.join(nodeModulesPath, '.bin');
console.log('.bin exists:', fs.existsSync(binPath));
if (fs.existsSync(binPath)) {
    console.log('.bin contents:', fs.readdirSync(binPath));
}

// Check if next exists in node_modules/next
const nextPath = path.join(nodeModulesPath, 'next');
console.log('next module exists:', fs.existsSync(nextPath));
if (fs.existsSync(nextPath)) {
    console.log('next package.json:', JSON.parse(fs.readFileSync(path.join(nextPath, 'package.json'), 'utf8')));
}

