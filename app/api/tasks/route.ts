import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Supabase env vars')
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    let query = supabase.from('tasks').select('*, created_by(full_name, email)').order('created_at', { ascending: false })
    if (category) query = query.eq('category', category)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ tasks: data })
  } catch (err: any) {
    console.error('Error fetching tasks:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      category,
      base_reward,
      total_budget,
      min_watch_seconds,
      external_url,
      is_active = true,
      created_by,
    } = body

    if (!title || !category || !base_reward || !total_budget) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const remaining_budget = total_budget

    const { data, error } = await supabase.from('tasks').insert({
      title,
      description: description || null,
      category,
      base_reward,
      total_budget,
      remaining_budget,
      min_watch_seconds: min_watch_seconds || 30,
      external_url: external_url || null,
      is_active,
      created_by: created_by || null,
      created_at: new Date().toISOString(),
    }).select().single()

    if (error) throw error

    return NextResponse.json({ task: data }, { status: 201 })
  } catch (err: any) {
    console.error('Error creating task:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
