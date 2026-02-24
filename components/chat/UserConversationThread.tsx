'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Send, X } from 'lucide-react'
import { useAuth } from '@/lib/hooks'

interface Message {
  id: string
  sender_role: 'user' | 'admin' | 'system'
  sender_id?: string
  content: string
  message_type: 'text' | 'suggested' | 'system' | 'action'
  created_at: string
}

interface UserConversationThreadProps {
  conversationId: string
  status: 'open' | 'closed'
  className?: string
  onBack?: () => void
}

export default function UserConversationThread({ conversationId, status, className = '', onBack }: UserConversationThreadProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [reply, setReply] = useState('')
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const isOpen = status === 'open'
  const canSend = isOpen && Boolean(reply.trim()) && !sending

  const formatShortTimestamp = (value: string) =>
    new Date(value).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  const orderedMessages = useMemo(
    () => [...messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [messages]
  )

  useEffect(() => {
    void loadMessages()
    const interval = setInterval(() => void loadMessages(), 4000)
    return () => clearInterval(interval)
  }, [conversationId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [orderedMessages.length])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [reply])

  async function loadMessages() {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`)
      if (!res.ok) throw new Error('Failed to load messages')
      const payload = await res.json()
      setMessages(payload?.messages || [])
    } catch (error) {
      console.error('Error loading conversation messages:', error)
    } finally {
      setLoading(false)
    }
  }

  async function sendReply() {
    if (!user || !canSend) return
    const content = reply.trim()
    setReply('')
    setSending(true)

    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          senderRole: 'user',
          senderId: user.id,
          messageType: 'text',
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'Failed to send message')
      }

      await loadMessages()
    } catch (error) {
      console.error('Error sending conversation reply:', error)
      setReply(content)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className={`rounded-2xl bg-white/5 border border-white/10 p-6 text-gray-300 flex items-center justify-center ${className}`}>
        Loading conversation...
      </div>
    )
  }

  return (
    <div className={`rounded-2xl bg-white/5 border border-white/10 flex flex-col min-h-[500px] ${className}`}>
      <div className="sticky top-0 z-10 p-4 border-b border-white/10 flex items-center justify-between bg-white/10 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          {onBack && (
            <button onClick={onBack} className="lg:hidden p-1.5 rounded-full bg-red-600/50 hover:bg-red-600/80 text-red-200 hover:text-white transition-colors mr-1">
              <X size={16} />
            </button>
          )}
          <p className="text-sm text-gray-300">Conversation</p>
        </div>
        <span
          className={`px-2 py-1 text-xs font-semibold rounded ${
            isOpen ? 'bg-emerald-500/20 text-emerald-300' : 'bg-gray-500/20 text-gray-300'
          }`}
        >
          {status.toUpperCase()}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {orderedMessages.length === 0 ? (
          <p className="text-gray-400 text-sm">No messages yet.</p>
        ) : (
          orderedMessages.map((message) => {
            const isUser = message.sender_role === 'user'
            return (
              <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] px-4 py-3 border rounded-2xl ${
                    isUser
                      ? 'bg-blue-600/30 border-blue-400/25 text-blue-50 rounded-br-md'
                      : message.sender_role === 'admin'
                        ? 'bg-emerald-700/25 border-emerald-300/20 text-emerald-100 rounded-bl-md'
                        : 'bg-pink-500/10 border-pink-300/20 text-gray-100 rounded-bl-md'
                  }`}
                >
                  <p className="text-xs opacity-75 mb-1">
                    {isUser ? 'You' : message.sender_role === 'admin' ? 'Admin' : 'System'}
                  </p>
                  <p className="break-words text-sm">{message.content}</p>
                  <span className="text-[11px] opacity-65 mt-2 block">
                    {formatShortTimestamp(message.created_at)}
                  </span>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t border-white/10">
        {isOpen ? (
          <div className="flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void sendReply()
                }
              }}
              placeholder="Reply to admin..."
              className="flex-1 px-3 py-2 rounded bg-white/10 text-white placeholder-gray-400 border border-white/10 resize-none min-h-[42px] max-h-[120px]"
              rows={1}
              disabled={sending}
            />
            <button
              onClick={() => void sendReply()}
              disabled={!canSend}
              className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white h-[42px]"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-400">
            This conversation is closed. Start a new request if you need more help.
          </p>
        )}
      </div>
    </div>
  )
}
