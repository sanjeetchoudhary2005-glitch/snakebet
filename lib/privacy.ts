export function maskUsername(username: string): string {
  if (!username) return '***';
  if (username.length <= 3) return `${username}***`;
  return `${username.slice(0, 3)}${'*'.repeat(Math.min(5, username.length - 3))}`;
}

export function formatGameName(gameId: string | null | undefined): string {
  if (!gameId) return 'Casino';
  return gameId
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return 'Just now';
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}
