import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Supabase env vars')
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { data, error } = await supabase.from('tasks').select('*, created_by(full_name, email)').eq('id', id).single()
    if (error) throw error
    return NextResponse.json({ task: data })
  } catch (err: any) {
    console.error('Error fetching task:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const updates = body || {}

    const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select().single()
    if (error) throw error

    // Log admin activity if adminId provided
    try {
      const adminId = body.adminId
      if (adminId) {
        await supabase.from('admin_activities').insert({
          admin_id: adminId,
          action: 'update_task',
          target_type: 'task',
          target_id: id,
          changes: updates,
          created_at: new Date().toISOString(),
        })
      }
    } catch (logErr) {
      console.error('Failed to log admin activity:', logErr)
    }

    return NextResponse.json({ task: data })
  } catch (err: any) {
    console.error('Error updating task:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const adminId = (body && body.adminId) || null

    const { data, error } = await supabase.from('tasks').update({ is_active: false }).eq('id', id).select().single()
    if (error) throw error

    if (adminId) {
      await supabase.from('admin_activities').insert({
        admin_id: adminId,
        action: 'deactivate_task',
        target_type: 'task',
        target_id: id,
        changes: { is_active: false },
        created_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({ task: data })
  } catch (err: any) {
    console.error('Error deactivating task:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
