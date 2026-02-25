// d:\FACTORY\fast-earn\components\InstagramTaskCard.tsx

"use client"

import { Task } from '@/lib/types'
import { Instagram } from 'lucide-react'

interface InstagramTaskCardProps {
  task: Task
  reward: number
  actionButton: React.ReactNode
}

export default function InstagramTaskCard({ task, reward, actionButton }: InstagramTaskCardProps) {
  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-white/10 hover:border-pink-500/30 transition-colors flex flex-col">
      <div className="mb-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 flex items-center justify-center shadow-lg">
          <Instagram className="text-white" size={28} />
        </div>
        <div>
          <h3 className="text-lg font-bold leading-tight">{task.title}</h3>
          <p className="text-pink-200/70 text-xs font-medium uppercase tracking-wider mt-1">Instagram Profile</p>
        </div>
      </div>

      <p className="text-gray-300 text-sm mb-6 flex-grow">{task.description}</p>

      <div className="space-y-2 mb-6 pb-6 border-b border-white/10">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Reward:</span>
          <span className="text-emerald-400 font-bold">{reward.toLocaleString()} RWF</span>
        </div>
      </div>

      {actionButton}
    </div>
  )
}
