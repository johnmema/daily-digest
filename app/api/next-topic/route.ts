import { NextResponse } from 'next/server'
// Retired: no legacy scheduler or leaked credential may write through this route.
export async function GET() {
  return NextResponse.json({ error: 'Retired; use the direct Daily Digest publisher' }, { status: 410 })
}
