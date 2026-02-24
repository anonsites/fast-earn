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
    const { userId, requestedTierId, requestedTier, amount, paidPhone, promoCode } = await req.json()
    let tierId = requestedTierId

    if (!tierId && requestedTier) {
      const { data: tier, error: tierError } = await supabase
        .from('tiers')
        .select('id')
        .eq('name', requestedTier)
        .single()

      if (tierError) throw tierError
      tierId = tier?.id
    }

    if (!userId || !tierId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Handle promo code if provided
    let discountAmount = 0
    let finalAmount = amount

    if (promoCode && promoCode.trim()) {
      const { data: promoData, error: promoError } = await supabase
        .from('promo_codes')
        .select('*')
        // case-sensitive exact match
        .eq('code', promoCode.trim())
        .eq('is_active', true)
        .single()

      if (promoData) {
        // Validate dates and usage limits
        const now = new Date()
        const validFrom = new Date(promoData.valid_from)
        const validUntil = promoData.valid_until ? new Date(promoData.valid_until) : null

        const isWithinDateRange =
          now >= validFrom && (!validUntil || now <= validUntil)
        const isUnderUsageLimit =
          !promoData.max_uses || promoData.used_count < promoData.max_uses

        if (isWithinDateRange && isUnderUsageLimit) {
          // Calculate discount
          discountAmount = (amount * promoData.discount_percent) / 100
          finalAmount = amount - discountAmount

          // Increment the used_count
          await supabase
            .from('promo_codes')
            .update({ used_count: (promoData.used_count || 0) + 1 })
            .eq('id', promoData.id)
        }
      }
    }

    const { data, error } = await supabase
      .from('upgrade_requests')
      .insert({
        user_id: userId,
        requested_tier_id: tierId,
        amount,
        paid_phone: paidPhone,
        promo_code: promoCode && promoCode.trim() ? promoCode.trim() : null,
        discount_amount: discountAmount,
        final_amount: finalAmount,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ upgradeRequest: data }, { status: 201 })
  } catch (err: any) {
    console.error('Error creating upgrade request:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'pending'

    const { data, error } = await supabase
      .from('upgrade_requests')
      .select('*, users!upgrade_requests_user_id_fkey(full_name, email), tiers(name, monthly_price)')
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ upgradeRequests: data })
  } catch (err: any) {
    console.error('Error fetching upgrade requests:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

