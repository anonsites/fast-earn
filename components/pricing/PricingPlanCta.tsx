'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks'
import type { ReactNode } from 'react'

type Plan = 'free' | 'pro' | 'pro_max'

interface PricingPlanCtaProps {
  locale: string
  plan: Plan
  className: string
  children: ReactNode
  currentUserTier?: string | null
  tierLoading?: boolean
}

export default function PricingPlanCta({ locale, plan, className, children, currentUserTier, tierLoading = false }: PricingPlanCtaProps) {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAuth()
  
  const isLoading = authLoading || tierLoading
  // Check if user already has this plan
  const isCurrentPlan = currentUserTier === plan

  const handleClick = () => {
    if (isLoading || isCurrentPlan) return

    if (plan === 'free') {
      if (isAuthenticated) {
        router.push(`/${locale}/dashboard`)
      } else {
        router.push(`/${locale}/register?plan=free`)
      }
      return
    }

    if (isAuthenticated) {
      router.push(`/${locale}/pricing/upgrade?tier=${plan}`)
      return
    }

    router.push(`/${locale}/register?plan=${plan}`)
  }

  return (
    <button type="button" onClick={handleClick} disabled={isLoading || isCurrentPlan} className={className}>
      {isLoading ? 'Loading...' : children}
    </button>
  )
}
