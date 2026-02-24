import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Supabase env vars')
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

export async function GET(req: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ promoCodes: data }, { status: 200 })
  } catch (err: any) {
    console.error('Error fetching promo codes:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { code, discountPercent, description, maxUses, validUntil } = await req.json()

    if (!code || discountPercent === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: code, discountPercent' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('promo_codes')
      .insert({
        code: code.trim(),
        discount_percent: discountPercent,
        description: description || null,
        max_uses: maxUses || null,
        valid_until: validUntil || null,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ promoCode: data }, { status: 201 })
  } catch (err: any) {
    console.error('Error creating promo code:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
