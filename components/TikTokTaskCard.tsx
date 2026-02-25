// d:\FACTORY\fast-earn\components\TikTokTaskCard.tsx

"use client"

import { useEffect } from 'react'
import { Task } from '@/lib/types'

interface TikTokTaskCardProps {
  task: Task
  reward: number
  actionButton: React.ReactNode
}

export default function TikTokTaskCard({ task, reward, actionButton }: TikTokTaskCardProps) {
  useEffect(() => {
    // Load TikTok embed script if not already present
    if (!document.querySelector('script[src="https://www.tiktok.com/embed.js"]')) {
      const script = document.createElement('script')
      script.src = 'https://www.tiktok.com/embed.js'
      script.async = true
      document.body.appendChild(script)
    }
  }, [])

  const getTikTokUsername = (url: string): string | null => {
    try {
      const urlObj = new URL(url)
      const match = urlObj.pathname.match(/^\/(@[\w.-]+)/)
      if (match && match[1]) {
        return match[1].substring(1)
      }
    } catch (e) {
      // Not a valid URL, maybe it's just a username
    }
    // Fallback for raw @username input
    if (url.startsWith('@')) {
      return url.substring(1).split('/')[0]
    }
    return null
  }

  const username = task.external_url ? getTikTokUsername(task.external_url) : null

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors flex flex-col overflow-hidden">
      <div className="p-4 bg-[#000000] flex justify-center">
        {username ? (
          <blockquote
            className="tiktok-embed"
            cite={task.external_url}
            data-unique-id={username}
            data-embed-type="creator"
            style={{ maxWidth: '100%', minWidth: '280px', margin: 0 }}
          >
            <section>
              <a target="_blank" href={task.external_url}>
                @{username}
              </a>
            </section>
          </blockquote>
        ) : (
          <div className="h-40 flex items-center justify-center text-gray-500">
            Invalid TikTok URL
          </div>
        )}
      </div>
      
      <div className="p-6 pt-4 flex flex-col flex-grow">
        <h3 className="text-xl font-bold mb-2">{task.title}</h3>
        <p className="text-gray-400 text-sm mb-4 flex-grow">{task.description}</p>

        <div className="space-y-2 mb-6 pb-6 border-b border-white/10">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Reward:</span>
            <span className="text-emerald-400 font-bold">{reward.toLocaleString()} RWF</span>
          </div>
        </div>

        {actionButton}
      </div>
    </div>
  )
}
