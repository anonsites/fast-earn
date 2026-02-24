import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Supabase env vars')
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

export async function POST(req: NextRequest) {
  try {
    const { userId, subject, metadata } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const { data, error } = await supabase.from('conversations').insert({
      user_id: userId,
      subject,
      metadata,
    }).select().single()

    if (error) throw error

    return NextResponse.json({ conversation: data }, { status: 201 })
  } catch (err: any) {
    console.error('Error creating conversation:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    let query = supabase.from('conversations').select('*, users:user_id(full_name, email)')

    if (userId) query = query.eq('user_id', userId)
    if (status) query = query.eq('status', status)
    if (type) query = query.eq('metadata->>type', type)

    const { data, error } = await query.order('updated_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ conversations: data })
  } catch (err: any) {
    console.error('Error fetching conversations:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
