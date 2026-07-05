import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execFileAsync = promisify(execFile);
const backupDir = process.env.DB_BACKUP_DIR || path.join(process.cwd(), 'backups');
const keep = Number(process.env.DB_BACKUP_KEEP || 7);

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function parseDatabaseUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parsed.port || '3306',
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ''),
  };
}

async function runMySQLBackup() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || !databaseUrl.startsWith('mysql')) {
    throw new Error('DATABASE_URL must be a MySQL connection string for backups');
  }

  await fs.mkdir(backupDir, { recursive: true });
  const target = path.join(backupDir, `mysql-${timestamp()}.sql`);
  const cfg = parseDatabaseUrl(databaseUrl);

  await execFileAsync(
    'mysqldump',
    ['-h', cfg.host, '-P', cfg.port, '-u', cfg.user, `--password=${cfg.password}`, cfg.database, `--result-file=${target}`]
  );

  const files = (await fs.readdir(backupDir))
    .filter((file) => file.endsWith('.sql'))
    .map((file) => path.join(backupDir, file));

  const stats = await Promise.all(files.map(async (file) => ({ file, stat: await fs.stat(file) })));
  const sorted = stats.sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);
  await Promise.all(sorted.slice(keep).map(({ file }) => fs.unlink(file)));

  console.log(`MySQL backup written: ${target}`);
}

async function main() {
  await runMySQLBackup();
  if (process.argv.includes('--watch')) {
    setInterval(runMySQLBackup, 24 * 60 * 60 * 1000);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
