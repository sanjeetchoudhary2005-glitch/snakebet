
import fs from 'fs';
console.log('Files in E:\\Snakebet:');
console.log(fs.readdirSync('E:\\Snakebet', { withFileTypes: true }).map(dirent => `${dirent.isDirectory() ? '[DIR]' : '[FILE]'} ${dirent.name}`));
