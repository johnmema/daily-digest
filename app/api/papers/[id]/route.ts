import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServiceClient()
  const { error } = await supabase.from('papers').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ deleted: true })
}
