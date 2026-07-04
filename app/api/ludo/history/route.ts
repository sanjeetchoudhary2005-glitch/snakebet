import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // For now, return an empty array of matches
    return NextResponse.json([])
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get ludo history' }, { status: 500 })
  }
}
