import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Supabase env vars')
}

const supabase = createClient(supabaseUrl, serviceRoleKey)
const MIN_WITHDRAWAL = 5000
const ALLOWED_METHODS = new Set(['mtn', 'airtel', 'bank'])

export async function POST(request: NextRequest) {
  try {
    const { userId, amount, method, contactPhone } = await request.json()
    const normalizedMethod = String(method || '').toLowerCase()
    const numericAmount = Number(amount)

    if (!userId || !numericAmount || !normalizedMethod) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!ALLOWED_METHODS.has(normalizedMethod)) {
      return NextResponse.json({ error: 'Invalid withdrawal method' }, { status: 400 })
    }

    if (numericAmount < MIN_WITHDRAWAL) {
      return NextResponse.json(
        { error: `Minimum withdrawal is ${MIN_WITHDRAWAL} RWF` },
        { status: 400 }
      )
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', userId)
      .single()

    if (userError) throw userError

    const balance = Number(user?.balance || 0)
    if (balance < numericAmount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    }

    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('withdrawals')
      .insert({
        user_id: userId,
        amount: numericAmount,
        method: normalizedMethod,
        contact_phone: contactPhone || null,
        status: 'pending',
      })
      .select()
      .single()

    if (withdrawalError) throw withdrawalError

    const { error: updateBalanceError } = await supabase
      .from('users')
      .update({ balance: balance - numericAmount })
      .eq('id', userId)

    if (updateBalanceError) throw updateBalanceError

    return NextResponse.json({ withdrawal }, { status: 201 })
  } catch (error: any) {
    console.error('Withdraw request error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
