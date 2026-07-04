import { logger } from './logger';

export function captureError(error: unknown, context: Record<string, unknown> = {}) {
  const normalized = error instanceof Error
    ? { name: error.name, message: error.message, stack: error.stack }
    : { message: String(error) };

  logger.error('captured_error', { ...normalized, context });
}
