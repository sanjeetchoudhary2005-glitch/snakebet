import * as Sentry from '@sentry/nextjs';

export async function sendHealthAlert(message: string, details: Record<string, unknown>) {
  const webhook = process.env.HEALTH_ALERT_WEBHOOK_URL;
  if (!webhook) return;

  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `**Snakebet health alert**\n${message}\n\`\`\`json\n${JSON.stringify(details, null, 2).slice(0, 1800)}\n\`\`\``,
      }),
    });
  } catch (error) {
    console.error('Failed to send health alert webhook:', error);
    Sentry.captureException(error);
  }
}
