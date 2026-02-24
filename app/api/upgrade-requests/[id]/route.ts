import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Supabase env vars')
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { status, adminId } = await req.json()

    if (!status || !['confirmed', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const updates: any = { status, updated_at: new Date().toISOString() }
    if (adminId) updates.admin_id = adminId

    // If confirmed, upgrade user tier
    if (status === 'confirmed') {
      const { data: upgradeReq, error: fetchErr } = await supabase
        .from('upgrade_requests')
        .select('*, users!upgrade_requests_user_id_fkey(id)')
        .eq('id', id)
        .single()

      if (fetchErr) throw fetchErr

      // Update user's tier
      const { error: updateErr } = await supabase
        .from('users')
        .update({ tier_id: upgradeReq.requested_tier_id })
        .eq('id', upgradeReq.user_id)

      if (updateErr) throw updateErr

      // Update active subscription tier with 30-day duration
      const now = new Date()
      const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // +30 days

      const { error: subUpdateErr } = await supabase
        .from('subscriptions')
        .update({
          tier_id: upgradeReq.requested_tier_id,
          start_date: now.toISOString(),
          end_date: endDate.toISOString(),
          status: 'active',
        })
        .eq('user_id', upgradeReq.user_id)
        .eq('status', 'active')

      if (subUpdateErr) {
        console.warn('Could not update subscription tier:', subUpdateErr)
        // Don't throw - user upgrade is still processed, subscription update is secondary
      } else {
        console.log(`[Upgrade Confirmed] User ${upgradeReq.user_id}: tier upgraded, expires ${endDate.toISOString()}`)
      }
    }

    const { data, error } = await supabase
      .from('upgrade_requests')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ upgradeRequest: data })
  } catch (err: any) {
    console.error('Error updating upgrade request:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
