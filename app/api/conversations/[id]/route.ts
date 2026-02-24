import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { id } = await params

    // Fetch conversation with user details
    const { data: conversation, error } = await supabase
      .from('conversations')
      .select('*, users:user_id(full_name, email)')
      .eq('id', id)
      .single()

    if (error) throw error

    return NextResponse.json({ conversation })
  } catch (error: any) {
    console.error('GET conversation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { status, assigned_to, is_read } = body
    const { id } = await params

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const updateData: any = {}
    if (status !== undefined) updateData.status = status
    if (assigned_to !== undefined) updateData.assigned_to = assigned_to
    if (is_read !== undefined) updateData.is_read = is_read

    const { data: updated, error } = await supabase
      .from('conversations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ conversation: updated })
  } catch (error: any) {
    console.error('PATCH conversation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const requesterId = body?.requesterId as string | undefined

    if (!requesterId) {
      return NextResponse.json({ error: 'Missing requesterId' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('id, user_id')
      .eq('id', id)
      .maybeSingle()

    if (conversationError) throw conversationError
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    if (conversation.user_id !== requesterId) {
      const { data: requester, error: requesterError } = await supabase
        .from('users')
        .select('role')
        .eq('id', requesterId)
        .maybeSingle()

      if (requesterError) throw requesterError
      if (requester?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const { error: deleteError } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('DELETE conversation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
