import supabase from './supabaseClient'
import { Withdrawal } from './types'

const MINIMUM_WITHDRAWAL = 5000 // 5,000 RWF

// Request withdrawal
export async function requestWithdrawal(
  userId: string,
  amount: number,
  method: string
): Promise<Withdrawal | null> {
  try {
    // Check minimum threshold
    if (amount < MINIMUM_WITHDRAWAL) {
      throw new Error(`Minimum withdrawal is ${MINIMUM_WITHDRAWAL} RWF`)
    }

    // Check user balance
    const { data: user, error: getUserError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', userId)
      .single()

    if (getUserError) throw getUserError
    if ((user.balance || 0) < amount) {
      throw new Error('Insufficient balance')
    }

    // Create withdrawal request
    const { data, error } = await supabase
      .from('withdrawals')
      .insert({
        user_id: userId,
        amount,
        method,
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw error

    // Debit wallet
    await supabase
      .from('users')
      .update({
        balance: (user.balance || 0) - amount,
      })
      .eq('id', userId)

    return data
  } catch (error) {
    console.error('Request withdrawal error:', error)
    throw error
  }
}

// Get user's withdrawal history
export async function getUserWithdrawals(
  userId: string,
  limit: number = 50
): Promise<Withdrawal[]> {
  try {
    const { data, error } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Get withdrawals error:', error)
    return []
  }
}

// Get pending withdrawals count
export async function getPendingWithdrawalsCount(
  userId: string
): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('withdrawals')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('status', 'pending')

    if (error) throw error
    return data?.length || 0
  } catch (error) {
    console.error('Get pending count error:', error)
    return 0
  }
}

// Get minimum withdrawal amount
export function getMinimumWithdrawal(): number {
  return MINIMUM_WITHDRAWAL
}
