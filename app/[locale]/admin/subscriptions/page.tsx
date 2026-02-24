"use client"

import { useState, useEffect, use } from 'react'
import { useAdminRoute } from '@/lib/hooks'
import { getAllSubscriptions } from '@/lib/admin'
import AdminLoading from '@/components/admin/AdminLoading'
import { TrendingUp, Users, Plus, Edit2, Trash2, Check, X } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'

interface SubscriptionManagementProps {
  params: Promise<{ locale: string }>
}

interface PromoCode {
  id: string
  code: string
  discount_percent: number
  is_active: boolean
  max_uses?: number
  used_count: number
  valid_from: string
  valid_until?: string
  description?: string
  created_at: string
}

interface ModalState {
  isOpen: boolean
  mode: 'add' | 'edit'
  promoCode?: PromoCode | null
}

interface DeleteModalState {
  isOpen: boolean
  promoCode?: PromoCode | null
}

export default function SubscriptionManagementPage({ params }: SubscriptionManagementProps) {
  const { locale } = use(params)
  const { isProtected } = useAdminRoute()
  const [loading, setLoading] = useState(true)
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
  const [promoLoading, setPromoLoading] = useState(false)
  const [modal, setModal] = useState<ModalState>({ isOpen: false, mode: 'add' })
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({ isOpen: false })
  const [formData, setFormData] = useState({
    code: '',
    discountPercent: 20,
    description: '',
    maxUses: '',
    validUntil: '',
  })
  const [stats, setStats] = useState({
    totalSubscribers: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    tierBreakdown: { free: 0, pro: 0, pro_max: 0 },
  })
  const [tierPrices, setTierPrices] = useState<Record<string, number>>({ free: 0, pro: 6000, pro_max: 12000 })

  useEffect(() => {
    if (!isProtected) return

    const loadSubscriptions = async () => {
      try {
        // Fetch current tier prices from database
        const { data: tiersData } = await supabase.from('tiers').select('name, monthly_price')
        const currentPrices: Record<string, number> = { free: 0 }
        if (tiersData) {
          tiersData.forEach((t) => {
            if (t.name) currentPrices[t.name] = t.monthly_price
          })
          setTierPrices((prev) => ({ ...prev, ...currentPrices }))
        }

        const { subscriptions: fetchedSubs, total: totalCount } = await getAllSubscriptions(50, page * 50)

        setSubscriptions(fetchedSubs)
        setTotal(totalCount)

        // Calculate statistics
        const activeCount = fetchedSubs.filter((s: any) => s.status === 'active').length
        const tierCounts = { free: 0, pro: 0, pro_max: 0 }

        fetchedSubs.forEach((sub: any) => {
          const tier = sub.tiers?.name || 'free'
          if (tier in tierCounts) {
            tierCounts[tier as keyof typeof tierCounts]++
          }
        })

        // Calculate monthly revenue from confirmed upgrade requests in the last 30 days
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const { data: revenueData } = await supabase
          .from('upgrade_requests')
          .select('final_amount, amount')
          .eq('status', 'confirmed')
          .gte('created_at', thirtyDaysAgo.toISOString())

        const monthlyRev =
          revenueData?.reduce((sum, req) => {
            const amount = req.final_amount ?? req.amount
            return sum + (Number(amount) || 0)
          }, 0) || 0

        setStats({
          totalSubscribers: totalCount,
          activeSubscriptions: activeCount,
          monthlyRevenue: monthlyRev,
          tierBreakdown: tierCounts,
        })
      } catch (error) {
        console.error('Error loading subscriptions:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSubscriptions()
  }, [isProtected, page])

  // Load promo codes
  useEffect(() => {
    if (!isProtected) return
    loadPromoCodes()
  }, [isProtected])

  async function loadPromoCodes() {
    setPromoLoading(true)
    try {
      const res = await fetch('/api/promo-codes')
      const data = await res.json()
      setPromoCodes(data.promoCodes || [])
    } catch (error) {
      console.error('Error loading promo codes:', error)
    } finally {
      setPromoLoading(false)
    }
  }

  function openAddModal() {
    setFormData({ code: '', discountPercent: 20, description: '', maxUses: '', validUntil: '' })
    setModal({ isOpen: true, mode: 'add' })
  }

  function openEditModal(promoCode: PromoCode) {
    setFormData({
      code: promoCode.code,
      discountPercent: promoCode.discount_percent,
      description: promoCode.description || '',
      maxUses: promoCode.max_uses?.toString() || '',
      validUntil: promoCode.valid_until ? new Date(promoCode.valid_until).toISOString().split('T')[0] : '',
    })
    setModal({ isOpen: true, mode: 'edit', promoCode })
  }

  function closeModal() {
    setModal({ isOpen: false, mode: 'add' })
    setFormData({ code: '', discountPercent: 20, description: '', maxUses: '', validUntil: '' })
  }

  async function handleSavePromo() {
    if (!formData.code.trim()) {
      alert('Promo code is required')
      return
    }

    try {
      if (modal.mode === 'add') {
        const res = await fetch('/api/promo-codes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: formData.code.trim(),
            discountPercent: formData.discountPercent,
            description: formData.description || null,
            maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
            validUntil: formData.validUntil || null,
          }),
        })
        if (!res.ok) throw new Error('Failed to create promo code')
      } else if (modal.promoCode) {
        const res = await fetch(`/api/promo-codes/${modal.promoCode.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: formData.code.trim(),
            discountPercent: formData.discountPercent,
            description: formData.description || null,
            maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
            validUntil: formData.validUntil || null,
          }),
        })
        if (!res.ok) throw new Error('Failed to update promo code')
      }

      closeModal()
      await loadPromoCodes()
    } catch (error) {
      console.error('Error saving promo code:', error)
      alert('Error saving promo code')
    }
  }

  function openDeleteModal(promoCode: PromoCode) {
    setDeleteModal({ isOpen: true, promoCode })
  }

  function closeDeleteModal() {
    setDeleteModal({ isOpen: false })
  }

  async function handleDeletePromo() {
    if (!deleteModal.promoCode) return

    try {
      const res = await fetch(`/api/promo-codes/${deleteModal.promoCode.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete promo code')

      closeDeleteModal()
      await loadPromoCodes()
    } catch (error) {
      console.error('Error deleting promo code:', error)
      alert('Error deleting promo code')
    }
  }

  if (loading) {
    return <AdminLoading />
  }

  const formatRevenue = (amount: number) => {
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)}M RWF`
    if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K RWF`
    return `${amount.toLocaleString()} RWF`
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-emerald-950 to-slate-900 text-white py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Subscription Management</h1>
          <p className="text-gray-300">Monitor subscriber tiers and revenue metrics</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {/* Total Subscribers */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-300">Total Subscribers</h3>
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-white">{stats.totalSubscribers}</p>
            <p className="text-xs text-gray-400 mt-2">{stats.activeSubscriptions} active</p>
          </div>

          {/* Monthly Revenue */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-300">Monthly Revenue</h3>
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-3xl font-bold text-white">{formatRevenue(stats.monthlyRevenue)}</p>
            <p className="text-xs text-gray-400 mt-2">Revenue 30 days ago</p>
          </div>

          {/* Free Tier */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Free Users</h3>
            <p className="text-3xl font-bold text-blue-400">{stats.tierBreakdown.free}</p>
            <p className="text-xs text-gray-400 mt-2">{((stats.tierBreakdown.free / Math.max(stats.totalSubscribers, 1)) * 100).toFixed(1)}% of total</p>
          </div>

          {/* Premium Tiers */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Premium Users</h3>
            <p className="text-3xl font-bold text-emerald-400">
              {stats.tierBreakdown.pro + stats.tierBreakdown.pro_max}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              {(((stats.tierBreakdown.pro + stats.tierBreakdown.pro_max) / Math.max(stats.totalSubscribers, 1)) * 100).toFixed(1)}% of total
            </p>
          </div>
        </div>

        {/* Tier Breakdown */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Free Tier */}
          <div className="p-8 rounded-2xl bg-white/5 border border-blue-500/30">
            <h2 className="text-2xl font-bold mb-4 text-blue-400">Free Tier</h2>
            <div className="space-y-3">
              <div>
                <span className="text-gray-400 text-sm mb-1 block">Subscribers</span>
                <p className="text-3xl font-bold">{stats.tierBreakdown.free}</p>
              </div>
              <div>
                <span className="text-gray-400 text-sm mb-1 block">Monthly Price</span>
                <p className="text-2xl font-bold text-emerald-400">{(tierPrices['free'] || 0).toLocaleString()} RWF</p>
              </div>
              <div>
                <span className="text-gray-400 text-sm mb-1 block">Features</span>
                <div className="text-sm text-gray-300 space-y-1">
                  <span className="block">✓ Video tasks</span>
                  <span className="block">✓ 1.0x multiplier</span>
                  <span className="block">✓ 5 tasks/day</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pro Tier */}
          <div className="p-8 rounded-2xl bg-white/5 border border-yellow-500/30">
            <h2 className="text-2xl font-bold mb-4 text-yellow-400">Pro Tier</h2>
            <div className="space-y-3">
              <div>
                <span className="text-gray-400 text-sm mb-1 block">Subscribers</span>
                <p className="text-3xl font-bold">{stats.tierBreakdown.pro}</p>
              </div>
              <div>
                <span className="text-gray-400 text-sm mb-1 block">Monthly Price</span>
                <p className="text-2xl font-bold text-yellow-400">{(tierPrices['pro'] || 0).toLocaleString()} RWF</p>
              </div>
              <div>
                <span className="text-gray-400 text-sm mb-1 block">Features</span>
                <div className="text-sm text-gray-300 space-y-1">
                  <span className="block">✓ All free features</span>
                  <span className="block">✓ 2.0x multiplier</span>
                  <span className="block">✓ 10 tasks/day</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pro Max Tier */}
          <div className="p-8 rounded-2xl bg-white/5 border border-purple-500/30">
            <h2 className="text-2xl font-bold mb-4 text-purple-400">Pro Max Tier</h2>
            <div className="space-y-3">
              <div>
                <span className="text-gray-400 text-sm mb-1 block">Subscribers</span>
                <p className="text-3xl font-bold">{stats.tierBreakdown.pro_max}</p>
              </div>
              <div>
                <span className="text-gray-400 text-sm mb-1 block">Monthly Price</span>
                <p className="text-2xl font-bold text-purple-400">{(tierPrices['pro_max'] || 0).toLocaleString()} RWF</p>
              </div>
              <div>
                <span className="text-gray-400 text-sm mb-1 block">Features</span>
                <div className="text-sm text-gray-300 space-y-1">
                  <span className="block">✓ All pro features</span>
                  <span className="block">✓ 3.0x multiplier</span>
                  <span className="block">✓ 20 tasks/day</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Promo Codes Management */}
        <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden mb-8">
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <h2 className="text-2xl font-bold">Promo Codes Management</h2>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-medium transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Promo Code
            </button>
          </div>

          {promoLoading ? (
            <div className="p-8 text-center text-gray-400">Loading promo codes...</div>
          ) : promoCodes.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No promo codes created yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="text-left py-4 px-6 font-semibold">Code</th>
                    <th className="text-left py-4 px-6 font-semibold">Discount</th>
                    <th className="text-left py-4 px-6 font-semibold">Status</th>
                    <th className="text-left py-4 px-6 font-semibold">Uses</th>
                    <th className="text-left py-4 px-6 font-semibold">Valid Until</th>
                    <th className="text-left py-4 px-6 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {promoCodes.map((promo) => (
                    <tr key={promo.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-4 px-6">
                        <p className="font-semibold text-white">{promo.code}</p>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-emerald-400 font-semibold">{promo.discount_percent}%</span>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            promo.is_active
                              ? 'bg-green-900/40 text-green-400'
                              : 'bg-gray-900/40 text-gray-400'
                          }`}
                        >
                          {promo.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-400">
                        {promo.max_uses ? `${promo.used_count}/${promo.max_uses}` : 'Unlimited'}
                      </td>
                      <td className="py-4 px-6 text-gray-400">
                        {promo.valid_until ? new Date(promo.valid_until).toLocaleDateString() : 'No expiry'}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(promo)}
                            className="p-2 hover:bg-blue-600/20 rounded transition-colors text-blue-400"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(promo)}
                            className="p-2 hover:bg-red-600/20 rounded transition-colors text-red-400"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Subscriptions */}
        <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-2xl font-bold">Recent Subscriptions</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="text-left py-4 px-6 font-semibold">User</th>
                  <th className="text-left py-4 px-6 font-semibold">Tier</th>
                  <th className="text-left py-4 px-6 font-semibold">Status</th>
                  <th className="text-left py-4 px-6 font-semibold">Start Date</th>
                  <th className="text-left py-4 px-6 font-semibold">End Date</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.length > 0 ? (
                  subscriptions.map((sub: any) => (
                    <tr key={sub.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-4 px-6">
                        <p className="font-semibold">{sub.users?.full_name}</p>
                        <span className="text-gray-400 text-xs block">{sub.users?.email}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2 py-1 bg-purple-900/40 text-purple-400 rounded text-xs font-semibold">
                          {sub.tiers?.name?.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            sub.status === 'active'
                              ? 'bg-green-900/40 text-green-400'
                              : 'bg-gray-900/40 text-gray-400'
                          }`}
                        >
                          {sub.status?.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-400">
                        {new Date(sub.start_date).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-gray-400">
                        {sub.end_date ? new Date(sub.end_date).toLocaleDateString() : '∞ Ongoing'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">
                      No subscriptions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-6 border-t border-white/10">
            <p className="text-sm text-gray-400">
              Showing {Math.min((page + 1) * 50, total)} of {total} subscriptions
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={(page + 1) * 50 >= total}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Promo Code Modal */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-white/10 p-6">
            <h2 className="text-2xl font-bold mb-4">
              {modal.mode === 'add' ? 'Add Promo Code' : 'Edit Promo Code'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., MTN RWANDA, BK ARENA"
                  className="w-full px-4 py-2 rounded-lg bg-white/10 text-white border border-white/10 placeholder:text-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Discount (%)</label>
                <input
                  type="number"
                  value={formData.discountPercent}
                  onChange={(e) => setFormData({ ...formData, discountPercent: parseInt(e.target.value) || 0 })}
                  placeholder="20"
                  min="1"
                  max="100"
                  className="w-full px-4 py-2 rounded-lg bg-white/10 text-white border border-white/10 placeholder:text-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="E.g., MTN Rwanda partnership promo"
                  className="w-full px-4 py-2 rounded-lg bg-white/10 text-white border border-white/10 placeholder:text-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Max Uses (Leave empty for unlimited)</label>
                <input
                  type="number"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                  placeholder="Leave empty for unlimited"
                  min="1"
                  className="w-full px-4 py-2 rounded-lg bg-white/10 text-white border border-white/10 placeholder:text-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Valid Until (Leave empty for no expiry)</label>
                <input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 text-white border border-white/10 placeholder:text-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => void handleSavePromo()}
                  className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
                >
                  {modal.mode === 'add' ? 'Create' : 'Update'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && deleteModal.promoCode && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-white/10 p-6">
            <h2 className="text-2xl font-bold mb-2">Delete Promo Code</h2>
            <p className="text-sm text-gray-300 mb-6">
              Are you sure you want to delete the promo code <span className="font-bold text-white">"{deleteModal.promoCode.code}"</span>? This action cannot be undone.
            </p>

            <div className="flex gap-2">
              <button
                onClick={closeDeleteModal}
                className="flex-1 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleDeletePromo()}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
