'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/lib/hooks'

type WithdrawMethod = 'mtn' | 'airtel' | 'bank'
type ExpectedInput = 'amount' | 'phone' | null

interface ChatMessage {
  id: string
  sender: 'system' | 'user'
  text: string
  created_at: string
  variant?: 'default' | 'error'
  buttons?: { label: string; value?: string }[]
}

interface WithdrawChatWidgetProps {
  locale?: string
  minimumWithdrawal: number
  onSwitchFlow?: (flow: 'upgrade' | 'withdraw' | 'support') => void
  onConversationCreated?: (conversationId: string) => void
}

export default function WithdrawChatWidget({ locale = 'en', minimumWithdrawal, onSwitchFlow, onConversationCreated }: WithdrawChatWidgetProps) {
  const { user } = useAuth()
  void locale

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [expecting, setExpecting] = useState<ExpectedInput>('amount')
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [amount, setAmount] = useState<number | null>(null)
  const [method, setMethod] = useState<WithdrawMethod | null>(null)
  const [isWithdrawalFailed, setIsWithdrawalFailed] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const inputEnabled = expecting !== null && !isWithdrawalFailed
  const inputPlaceholder = useMemo(() => {
    if (expecting === 'amount') return `Enter amount to withdraw (min ${minimumWithdrawal.toLocaleString()})`
    if (expecting === 'phone') return 'Enter receiving phone number'
    return 'Select an option to continue'
  }, [expecting, minimumWithdrawal])

  useEffect(() => {
    if (!user || initialized) return
    setInitialized(true)
    void startFlow()
  }, [user, initialized])

  useEffect(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current
      // Cap the height at 480px (equivalent to tailwind's h-120)
      const newHeight = Math.min(container.scrollHeight, 480)
      container.style.height = `${newHeight}px`
    }
    // Keep smooth scrolling to the new message
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

  function pushSystem(text: string, buttons?: ChatMessage['buttons'], variant: ChatMessage['variant'] = 'default') {
    setMessages((prev) => [...prev, { id: nextId(), sender: 'system', text, created_at: nowIso(), buttons, variant }])
  }

  function pushUser(text: string) {
    setMessages((prev) => [...prev, { id: nextId(), sender: 'user', text, created_at: nowIso() }])
  }

  async function ensureConversation() {
    if (!user) return null
    if (conversationId) return conversationId

    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          subject: 'Withdrawal Request',
          metadata: { type: 'withdraw' },
        }),
      })
      const payload = await res.json()
      const id = payload?.conversation?.id as string | undefined
      if (!id) throw new Error('Missing conversation id')
      setConversationId(id)
      onConversationCreated?.(id)
      return id
    } catch (error) {
      console.error('Error creating withdrawal conversation:', error)
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
      console.error('Error appending withdrawal message:', error)
    }
  }

  async function systemAndLog(
    text: string,
    convId?: string | null,
    buttons?: ChatMessage['buttons'],
    variant: ChatMessage['variant'] = 'default'
  ) {
    pushSystem(text, buttons, variant)
    await appendMessage(text, 'system', convId)
  }

  async function startFlow() {
    const convId = await ensureConversation()
    setIsWithdrawalFailed(false)
    setExpecting('amount')
    setAmount(null)
    setMethod(null)
    await systemAndLog(
      `Step 1: Enter amount to withdraw in RWF (minimum ${minimumWithdrawal.toLocaleString()}).`,
      convId
    )
  }

  async function handleButton(value?: string) {
    if (!value || sending) return

    if (value === 'flow_close') {
      window.location.assign(`/${locale}/dashboard`)
      return
    }

    if (value === 'flow_upgrade') {
      if (onSwitchFlow) onSwitchFlow('upgrade')
      return
    }

    if (value === 'flow_support') {
      if (onSwitchFlow) onSwitchFlow('support')
      return
    }

    if (value === 'withdraw_restart') {
      await startFlow()
      return
    }

    if (value.startsWith('withdraw_method_')) {
      const selected = value.replace('withdraw_method_', '') as WithdrawMethod
      setMethod(selected)
      setExpecting('phone')
      pushSystem('Step 3: Enter the phone number that will receive money.')
      return
    }
  }

  async function handleSend() {
    if (!user || !input.trim() || !expecting || sending) return

    const value = input.trim()
    setSending(true)
    setInput('')
    pushUser(value)

    const convId = await ensureConversation()
    await appendMessage(value, 'user', convId)

    if (expecting === 'amount') {
      const numericAmount = Number(value)
      if (!numericAmount || numericAmount < minimumWithdrawal) {
        await systemAndLog(`Invalid amount. Enter a amount above the minimum of ${minimumWithdrawal.toLocaleString()}.`, convId)
        setExpecting('amount')
        setSending(false)
        return
      }

      setAmount(numericAmount)
      setExpecting(null)
      await systemAndLog('Step 2: choose payout method.',convId, [
        { label: 'MTN', value: 'withdraw_method_mtn' },
        { label: 'Airtel', value: 'withdraw_method_airtel' },
        { label: 'Bank', value: 'withdraw_method_bank' },
        { label: 'Need support', value: 'flow_support' },
      ])
      setSending(false)
      return
    }

    if (expecting === 'phone') {
      if (!/^[0-9+]{8,15}$/.test(value)) {
        await systemAndLog('Invalid phone number. Use digits with country code  prefix.', convId)
        setExpecting('phone')
        setSending(false)
        return
      }

      if (!amount || !method) {
        await systemAndLog('Missing amount or payout method. Restarting withdrawal flow.', convId)
        await startFlow()
        setSending(false)
        return
      }

      await systemAndLog('Submitting withdrawal request...', convId)
      try {
        const res = await fetch('/api/withdraw', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            amount,
            method,
            contactPhone: value,
          }),
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err?.error || 'Failed to submit withdrawal request')
        }

        await systemAndLog('Withdrawal request submitted successfully. Due to high volume, processing may take a while.', convId)
        setIsWithdrawalFailed(false)
        setExpecting(null)
        setAmount(null)
        setMethod(null)
        pushSystem('Need anything else?', [
          { label: 'Close', value: 'flow_close' },
          { label: 'Upgrade Account', value: 'flow_upgrade' },
          { label: 'Contact Support', value: 'flow_support' },
        ])
      } catch (error: any) {
        await systemAndLog(
          `Withdrawal request failed: ${error?.message || 'Unknown error'}`,
          convId,
          [
            { label: 'Contact Support', value: 'flow_support' },
            { label: 'Restart Withdrawal', value: 'withdraw_restart' },
          ],
          'error'
        )
        setIsWithdrawalFailed(true)
        setExpecting(null)
      }

      setSending(false)
      return
    }

    setSending(false)
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-white/5 p-4 rounded-2xl border border-white/10">
      <div ref={messagesContainerRef} className="overflow-y-auto mb-4 pr-1 space-y-3 transition-[height] duration-300 ease-in-out">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[95%] px-4 py-3 rounded-2xl border ${
                m.sender === 'user'
                  ? 'bg-blue-600/30 border-blue-400/30 text-blue-50 rounded-br-md'
                  : m.variant === 'error'
                    ? 'bg-red-600/20 border-red-400/40 text-red-100 rounded-bl-md'
                    : 'bg-[#001b3d] border-blue-800/50 text-gray-100 rounded-bl-md'
              }`}
            >
              <p className="text-sm leading-relaxed">{m.text}</p>
              {m.buttons && m.buttons.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {m.buttons.map((b) => (
                    <button
                      key={`${m.id}-${b.label}`}
                      onClick={() => handleButton(b.value)}
                      className={`px-3 py-1.5 rounded-full text-white text-xs ${
                        b.value === 'flow_close'
                          ? 'bg-red-600 hover:bg-red-500'
                          : b.value === 'flow_support'
                            ? 'bg-emerald-600 hover:bg-emerald-500'
                            : 'bg-blue-600 hover:bg-blue-500'
                      }`}
                      disabled={sending}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              )}
              <span className="text-[11px] opacity-65 mt-2 block">{formatBubbleTime(m.created_at)}</span>
            </div>
          </div>
        ))}
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
        <p className={`text-xs mt-2 ${isWithdrawalFailed ? 'text-red-300' : 'text-gray-400'}`}>
          {isWithdrawalFailed
            ? 'Withdrawal request failed. restart or contact support.'
            : 'Select one of the suggested options above to continue.'}
        </p>
      )}
    </div>
  )
}
