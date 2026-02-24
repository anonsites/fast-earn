"use client"

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'

interface NewTaskForm {
  title: string
  description: string
  category: string
  base_reward: number
  total_budget: number
  min_watch_seconds?: number
  external_url: string
}

interface AdminCreateTaskPageProps {
  params: Promise<{ locale: string }>
}

export default function AdminCreateTaskPage({ params }: AdminCreateTaskPageProps) {
  const { locale } = use(params)
  const router = useRouter()
  const [form, setForm] = useState<NewTaskForm>({
    title: '',
    description: '',
    category: 'video',
    base_reward: 100,
    total_budget: 100000,
    min_watch_seconds: 30,
    external_url: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (k: keyof NewTaskForm, v: any) => setForm((s) => ({ ...s, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Validate required fields
      if (!form.title.trim()) {
        throw new Error('Title is required')
      }
      if (!form.external_url.trim()) {
        throw new Error('Link is required')
      }

      const user = await getCurrentUser()
      const payload = {
        ...form,
        base_reward: Number(form.base_reward),
        total_budget: Number(form.total_budget),
        min_watch_seconds: form.min_watch_seconds ? Number(form.min_watch_seconds) : undefined,
        created_by: user?.id || null,
      }

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to create task')

      // Redirect to admin tasks list
      router.push(`/${locale}/admin/tasks`)
    } catch (err: any) {
      setError(err.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-emerald-950 to-slate-900 text-white py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="flex items-center justify-between mb-4">
          <a href={`/${locale}/admin/tasks`} className="text-sm text-gray-300 hover:text-white">← Back</a>
        </div>
        <h1 className="text-3xl font-bold mb-4">Create New Task</h1>
        <form onSubmit={handleSubmit} className="space-y-4 bg-white/5 p-6 rounded-2xl border border-white/10">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Title</label>
            <input value={form.title} onChange={(e) => handleChange('title', e.target.value)} className="w-full px-3 py-2 rounded bg-black/40" required />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => handleChange('description', e.target.value)} className="w-full px-3 py-2 rounded bg-black/40" rows={4} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Category</label>
              <select value={form.category} onChange={(e) => handleChange('category', e.target.value)} className="w-full px-3 py-2 rounded bg-black/40">
                <option value="video">Video</option>
                <option value="click">Click</option>
                <option value="follow">Follow</option>
                <option value="subscribe">Subscribe</option>
                <option value="install">Install</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Base Reward (RWF)</label>
              <input type="number" value={form.base_reward} onChange={(e) => handleChange('base_reward', Number(e.target.value))} className="w-full px-3 py-2 rounded bg-black/40" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Total Budget (RWF)</label>
              <input type="number" value={form.total_budget} onChange={(e) => handleChange('total_budget', Number(e.target.value))} className="w-full px-3 py-2 rounded bg-black/40" required />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Min Watch Seconds</label>
              <input type="number" value={form.min_watch_seconds} onChange={(e) => handleChange('min_watch_seconds', Number(e.target.value))} className="w-full px-3 py-2 rounded bg-black/40" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Video URL / Link <span className="text-red-400">*</span></label>
            <input type="url" value={form.external_url} onChange={(e) => handleChange('external_url', e.target.value)} placeholder="https://example.com/video" className="w-full px-3 py-2 rounded bg-black/40" required />
          </div>

          {error && <div className="p-3 rounded bg-red-500/20 text-red-300 text-sm">{error}</div>}

          <button type="submit" disabled={loading} className="w-full px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 font-semibold mt-6">
            {loading ? 'Creating...' : 'Create Task'}
          </button>
        </form>
      </div>
    </div>
  )
}
