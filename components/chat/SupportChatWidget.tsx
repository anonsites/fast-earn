'use client'

import { useEffect, useMemo, useRef, useState, ReactNode } from 'react'
import { useAuth } from '@/lib/hooks'

type ExpectedInput = 'support_message' | null

interface ChatMessage {
  id: string
  sender: 'system' | 'user'
  text: string
  created_at: string
  buttons?: { label: string; value?: string }[]
  content?: ReactNode
}

interface SupportChatWidgetProps {
  locale?: string
  onConversationCreated?: (conversationId: string) => void
  onFirstMessageSent?: () => void
  onCancel?: () => void
}

export default function SupportChatWidget({ locale = 'en', onConversationCreated, onFirstMessageSent, onCancel }: SupportChatWidgetProps) {
  const { user } = useAuth()
  void locale

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [expecting, setExpecting] = useState<ExpectedInput>(null)
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [messageSent, setMessageSent] = useState(false)
  const [showSubmittedTag, setShowSubmittedTag] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const inputEnabled = expecting !== null && selectedTopic !== null
  const inputPlaceholder = useMemo(() => {
    if (!selectedTopic) return 'Select a topic to continue'
    return expecting === 'support_message' ? 'Describe your issue clearly' : 'Select an option to continue'
  }, [expecting, selectedTopic])

  useEffect(() => {
    if (!user || initialized) return
    setInitialized(true)
    void startFlow()
  }, [user, initialized])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [input])

  function nextId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  }

  function nowIso() {
    return new Date().toISOString()
  }

  function formatBubbleTime(value: string) {
    return new Date(value).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function pushSystem(text: string, buttons?: ChatMessage['buttons'], content?: ReactNode) {
    setMessages((prev) => [...prev, { id: nextId(), sender: 'system', text, created_at: nowIso(), buttons, content }])
  }

  function pushUser(text: string) {
    setMessages((prev) => [...prev, { id: nextId(), sender: 'user', text, created_at: nowIso() }])
  }

  async function ensureConversation() {
    if (!user) return null
    if (conversationId) return conversationId

    try {
      const subject = selectedTopic 
        ? `Support: ${selectedTopic.replace('_', ' ')}`
        : 'Support Request'
      
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          subject,
          metadata: { 
            type: 'support',
            topic: selectedTopic,
          },
        }),
      })
      const payload = await res.json()
      const id = payload?.conversation?.id as string | undefined
      if (!id) throw new Error('Missing conversation id')
      setConversationId(id)
      onConversationCreated?.(id)
      return id
    } catch (error) {
      console.error('Error creating support conversation:', error)
      return null
    }
  }

  async function appendMessage(content: string, senderRole: 'user' | 'system', convId?: string | null) {
    const id = convId || conversationId
    if (!id) return
    try {
      await fetch(`/api/conversations/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          senderRole,
          senderId: user?.id || null,
          messageType: 'text',
        }),
      })
    } catch (error) {
      console.error('Error appending support message:', error)
    }
  }

  async function systemAndLog(text: string, convId?: string | null, buttons?: ChatMessage['buttons']) {
    pushSystem(text, buttons)
    await appendMessage(text, 'system', convId)
  }

  async function startFlow() {
    const name = (user as any)?.full_name?.split(' ')[0] || (user as any)?.user_metadata?.full_name?.split(' ')[0] || 'User'
    
    const introContent = (
      <p>
        <span className="text-emerald-500">Hello {name}</span>, Welcome to FastEarn support panel, What can we help you with?
      </p>
    )

    pushSystem('Hello...', [
      { label: 'Account Issue', value: 'support_topic_account' },
      { label: 'Payment Issue', value: 'support_topic_payment' },
      { label: 'Task Issue', value: 'support_topic_task' },
      { label: 'Other', value: 'support_topic_other' },
      { label: 'Cancel', value: 'cancel_flow' },
    ], introContent)
  }

  async function handleButton(value?: string) {
    if (!value || sending) return

    if (value === 'cancel_flow') {
      onCancel?.()
      return
    }

    if (value.startsWith('support_topic_')) {
      const topic = value.replace('support_topic_', '').replace(/_/g, ' ')
      setSelectedTopic(topic)
      
      const content = (
        <span>
          Selected topic: <span className="font-bold text-emerald-400">{topic}</span>
          <br /><br />
          Please describe your issue in detail.
        </span>
      )
      
      pushSystem(`Topic: ${topic}\n\nPlease describe your issue in detail.`, undefined, content)
      setExpecting('support_message')
    }
  }

  async function handleSend() {
    if (!user || !input.trim() || !expecting || !selectedTopic || sending) return

    const message = input.trim()
    setSending(true)
    setInput('')
    pushUser(message)

    const convId = await ensureConversation()
    await appendMessage(message, 'user', convId)

    // Call callback on first message
    if (!messageSent) {
      setMessageSent(true)
      onFirstMessageSent?.()
    }

    // Show submitted tag without sending it as a message
    setShowSubmittedTag(true)
    setExpecting('support_message')
    setSending(false)
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-white/5 p-4 rounded-2xl border border-white/10">
      <div className="mb-4 pr-1 space-y-3">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[95%] px-4 py-3 rounded-2xl border ${
                m.sender === 'user'
                  ? 'bg-blue-600/30 border-blue-400/30 text-blue-50 rounded-br-md'
                  : 'bg-pink-500/10 border-pink-300/20 text-gray-100 rounded-bl-md'
              }`}
            >
              {m.content ? <div className="text-sm leading-relaxed">{m.content}</div> : <p className="text-sm leading-relaxed">{m.text}</p>}
              {m.buttons && m.buttons.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {m.buttons.map((b) => (
                    <button
                      key={`${m.id}-${b.label}`}
                      onClick={() => handleButton(b.value)}
                      className={`px-3 py-1.5 rounded-full text-white text-xs ${
                        b.value === 'cancel_flow' 
                          ? 'bg-red-500/80 hover:bg-red-500' 
                          : 'bg-blue-600 hover:bg-blue-500'
                      }`}
                      disabled={sending}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {showSubmittedTag && (
          <div className="flex justify-start">
            <div className="px-3 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-medium">
              ✓ Message submitted. Our support team will respond shortly.
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={sending || !inputEnabled}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !sending && inputEnabled) {
              e.preventDefault()
              void handleSend()
            }
          }}
          placeholder={inputPlaceholder}
          className="flex-1 px-3 py-2 rounded-xl bg-white/10 text-white disabled:opacity-50 border border-white/10"
        />
        <button
          onClick={() => void handleSend()}
          disabled={sending || !input.trim() || !inputEnabled}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 rounded-xl text-white"
        >
          Send
        </button>
      </div>

      {!inputEnabled && (
        <p className="text-xs text-gray-400 mt-2">
          Select one of the suggested topic options above.
        </p>
      )}
    </div>
  )
}
