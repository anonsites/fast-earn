export const TIER_MULTIPLIERS = {
  free: 1.0,
  pro: 2.0,
  pro_max: 3.0,
}

export const TIER_PRICES = {
  free: 0,
  pro: 6000,
  pro_max: 12000,
}

export function calculateReward(baseReward: number, tierMultiplier: number): number {
  return baseReward * tierMultiplier
}
