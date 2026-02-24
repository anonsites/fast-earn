import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Supabase env vars')
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { code, discountPercent, description, maxUses, validUntil, isActive } = await req.json()

    const updateData: any = {}

    if (code !== undefined) updateData.code = code.trim()
    if (discountPercent !== undefined) updateData.discount_percent = discountPercent
    if (description !== undefined) updateData.description = description
    if (maxUses !== undefined) updateData.max_uses = maxUses
    if (validUntil !== undefined) updateData.valid_until = validUntil
    if (isActive !== undefined) updateData.is_active = isActive

    const { data, error } = await supabase
      .from('promo_codes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ promoCode: data }, { status: 200 })
  } catch (err: any) {
    console.error('Error updating promo code:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const { error } = await supabase
      .from('promo_codes')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ message: 'Promo code deleted successfully' }, { status: 200 })
  } catch (err: any) {
    console.error('Error deleting promo code:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
