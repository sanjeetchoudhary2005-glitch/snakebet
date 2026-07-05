import { NextResponse } from 'next/server';
import { ZodError, ZodType } from 'zod';

export function validationError(error: ZodError) {
  return NextResponse.json(
    {
      error: 'Validation failed',
      fields: error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    },
    { status: 400 }
  );
}

export async function parseJson<T>(req: Request, schema: ZodType<T>): Promise<T | NextResponse> {
  try {
    const body = await req.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error);
    }
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
}

export function isNextResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}
