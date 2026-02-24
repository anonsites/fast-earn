import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Supabase env vars')
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { content, senderRole, senderId, messageType } = await req.json()
    const { id } = await params

    if (!content || !id) {
      return NextResponse.json(
        { error: 'Missing content or conversation id' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: id,
        content,
        sender_role: senderRole || 'user',
        sender_id: senderId,
        message_type: messageType || 'text',
      })
      .select()
      .single()

    if (error) throw error

    const { error: touchError } = await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id)

    if (touchError) {
      console.error('Error updating conversation timestamp:', touchError)
    }

    return NextResponse.json({ message: data }, { status: 201 })
  } catch (err: any) {
    console.error('Error creating message:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Missing conversation id' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({ messages: data })
  } catch (err: any) {
    console.error('Error fetching messages:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
