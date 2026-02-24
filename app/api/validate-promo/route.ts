import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !anonKey) {
  throw new Error('Missing Supabase env vars')
}

const supabase = createClient(supabaseUrl, anonKey)

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json()

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Promo code is required', valid: false },
        { status: 400 }
      )
    }

    // Query for the promo code
    const { data: promoData, error } = await supabase
      .from('promo_codes')
      .select('*')
      // case-sensitive exact match
      .eq('code', code.trim())
      .eq('is_active', true)
      .single()

    if (error || !promoData) {
      return NextResponse.json(
        { error: 'Promo code not found or inactive', valid: false },
        { status: 404 }
      )
    }

    // Check if code is within valid date range
    const now = new Date()
    const validFrom = new Date(promoData.valid_from)
    const validUntil = promoData.valid_until ? new Date(promoData.valid_until) : null

    if (now < validFrom) {
      return NextResponse.json(
        { error: 'Promo code not yet valid', valid: false },
        { status: 400 }
      )
    }

    if (validUntil && now > validUntil) {
      return NextResponse.json(
        { error: 'Promo code has expired', valid: false },
        { status: 400 }
      )
    }

    // Check if code has reached max uses
    if (promoData.max_uses && promoData.used_count >= promoData.max_uses) {
      return NextResponse.json(
        { error: 'Promo code usage limit reached', valid: false },
        { status: 400 }
      )
    }

    // Code is valid
    return NextResponse.json(
      {
        valid: true,
        code: promoData.code,
        discountPercent: promoData.discount_percent,
        description: promoData.description,
      },
      { status: 200 }
    )
  } catch (err: any) {
    console.error('Error validating promo code:', err)
    return NextResponse.json(
      { error: 'Failed to validate promo code', valid: false },
      { status: 500 }
    )
  }
}
