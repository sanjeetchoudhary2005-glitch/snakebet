
import fs from 'fs';
import path from 'path';
const nextBin = path.join('node_modules', 'next', 'dist', 'bin', 'next');
console.log('Checking next bin path:', nextBin);
console.log('nextBin exists:', fs.existsSync(nextBin));
if (fs.existsSync(nextBin)) {
  console.log('nextBin stats:', fs.statSync(nextBin));
}
