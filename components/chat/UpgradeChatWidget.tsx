'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/lib/hooks'
import { Info, Phone } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'

type UpgradeTier = 'pro' | 'pro_max'

interface ChatMessage {
  id: string
  sender: 'system' | 'user'
  text: string
  created_at: string
  buttons?: { label: string; value?: string }[]
  content?: React.ReactNode
  meta?: Record<string, any>
}

interface UpgradeChatWidgetProps {
  initialTier?: string
  locale?: string
  promoCode?: string | null
  promoDiscount?: number | null
  tierPrices: Record<string, number>
  onSwitchFlow?: (flow: 'upgrade' | 'withdraw' | 'support') => void
  onConversationCreated?: (conversationId: string) => void
}

const UPGRADE_LABELS: Record<UpgradeTier, string> = {
  pro: 'Pro',
  pro_max: 'Pro Max',
}

function UssdCopy({ code }: { code: string }) {
  // The '#' character must be URL-encoded for the 'tel:' link to work correctly.
  const telLink = `tel:${code.replace(/#/g, '%23')}`

  return (
    <a
      href={telLink}
      className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded cursor-pointer hover:bg-white/10 transition-colors"
      title="Click to dial"
    >
      <span className="font-bold text-white select-all">{code}</span>
      <Phone size={14} className="text-blue-300" />
    </a>
  )
}

export default function UpgradeChatWidget({ initialTier, locale = 'en', promoCode, promoDiscount, tierPrices, onSwitchFlow, onConversationCreated }: UpgradeChatWidgetProps) {
  const { user } = useAuth()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [selectedTier, setSelectedTier] = useState<UpgradeTier | null>(null)
  const [expectingPhone, setExpectingPhone] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [currentUssd, setCurrentUssd] = useState<string>('')
  const [sending, setSending] = useState(false)
  const [momoPayCode, setMomoPayCode] = useState<string>('387483')
  const [initialized, setInitialized] = useState(false)
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(promoCode || null)
  const [appliedDiscount, setAppliedDiscount] = useState<number | null>(promoDiscount || null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const prevPromoRef = useRef<{ code: string | null; discount: number | null }>({ code: promoCode || null, discount: promoDiscount ?? null })
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Fetch momo pay code from system settings
  useEffect(() => {
    const fetchMomoCode = async () => {
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'momo_pay_code')
        .single()
      if (data?.value) setMomoPayCode(data.value)
    }
    fetchMomoCode()
  }, [])

  // Keep internal promo state in sync when parent passes new promoCode/promoDiscount
  useEffect(() => {
    setAppliedPromoCode(promoCode || null)
    setAppliedDiscount(promoDiscount ?? null)

    // If a tier is already selected, just recompute USSD (do not push a chat message here).
    if (selectedTier) {
      const amount = tierPrices[selectedTier] || 0
      const finalAmount = promoDiscount ? amount - (amount * promoDiscount) / 100 : amount
      const ussd = `*182*8*1*${momoPayCode}*${Math.ceil(finalAmount)}#`
      setCurrentUssd(ussd)
      // If promo changed (e.g., modal applied), update the last payment message's content/text
      const prev = prevPromoRef.current
      const changed = (prev.code || null) !== (promoCode || null) || (prev.discount ?? null) !== (promoDiscount ?? null)
      if (changed) {
        // update prev ref
        prevPromoRef.current = { code: promoCode || null, discount: promoDiscount ?? null }

        // find last payment message
        setMessages((msgs) => {
          const idx = [...msgs].reverse().findIndex((m) => m.meta && m.meta.payment)
          if (idx === -1) return msgs
          const realIdx = msgs.length - 1 - idx
          const old = msgs[realIdx]

          // build updated text/content similar to selectTier
          const amount = tierPrices[old.meta?.tier as UpgradeTier] || 0
          const finalAmount = (promoDiscount ? amount - (amount * promoDiscount) / 100 : amount)
          const newUssd = `*182*8*1*${momoPayCode}*${Math.ceil(finalAmount)}#`

          const telLink = `tel:${newUssd.replace(/#/g, '%23')}`
          const newPlain = old.text.replace(/Amount:[\s\S]*/g, `Amount: ${amount.toLocaleString()} RWF${promoDiscount ? `\nDiscount: ${promoDiscount}% (${Math.ceil((amount * promoDiscount) / 100).toLocaleString()} RWF)\nFinal Amount: ${Math.ceil(finalAmount).toLocaleString()} RWF` : ''}\nMethod: MTN MOMO (${momoPayCode})\nDial: ${newUssd}\n\nAfter payment, tap "I have paid".`)

          const name = (user as any)?.full_name?.split(' ')[0] || (user as any)?.user_metadata?.full_name?.split(' ')[0] || 'User'
          const tierLabel = UPGRADE_LABELS[old.meta?.tier as UpgradeTier]

          const newContent = (
            <div className="space-y-3">
              <p><span className="text-emerald-500">Hey {name},</span> Send the final amount and select I have paid. Our agent may comfirm your payment</p>
              <div className="bg-black/20 p-3 rounded-lg space-y-1.5 text-sm font-mono border border-white/5">
                <div className="flex justify-between">
                  <span className="text-gray-400">Category:</span>
                  <span className="font-bold text-white">{old.meta?.tier ? UPGRADE_LABELS[old.meta.tier as UpgradeTier] : 'Tier'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Original Amount:</span>
                  <span className={`font-bold ${promoDiscount ? 'text-gray-400 line-through' : 'text-emerald-400'}`}>{amount.toLocaleString()} RWF</span>
                </div>
                {promoDiscount && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Discount ({promoDiscount}%):</span>
                      <span className="font-bold text-green-400">-{Math.ceil((amount * promoDiscount) / 100).toLocaleString()} RWF</span>
                    </div>
                    <div className="flex justify-between border-t border-white/10 pt-1.5 mt-1">
                      <span className="text-white">Final Amount:</span>
                      <span className="font-bold text-white">{Math.ceil(finalAmount).toLocaleString()} RWF</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">Method:</span>
                  <span className="font-bold text-yellow-400">MTN MOMO ({momoPayCode})</span>
                </div>
                <div className="flex justify-between items-center gap-2 pt-2 border-t border-white/10 mt-1">
                  <span className="text-gray-400">Dial:</span>
                  <UssdCopy code={newUssd} />
                </div>
                <a
                  href={telLink}
                  className="!mt-3 w-full text-center block bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded"
                >
                  PAY
               </a>
              </div>
              <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                <Info className="w-3 h-3 text-red-400" />
                <span>Send money on Momo pay, and select <span className="text-orange-300 font-semibold">I have paid</span> button below to continue.</span>
                </h3>
              {promoCode && (
                <p className="text-[3px] text-green-400/80">✓ <span className="text-amber-50">Promo code "{promoCode}" applied</span></p>
              )}
            </div>
          )

          const newMsgs = msgs.slice()
          newMsgs[realIdx] = { ...old, text: newPlain, content: newContent }
          return newMsgs
        })
      }
    }
  }, [promoCode, promoDiscount, user, tierPrices, selectedTier, momoPayCode])

  const inputEnabled = expectingPhone
  const inputPlaceholder = useMemo(() => {
    return expectingPhone ? 'Enter phone used to pay' : 'Select an option to continue'
  }, [expectingPhone])

  useEffect(() => {
    if (!user || initialized) return
    setInitialized(true)
    void startFlow(initialTier === 'pro' || initialTier === 'pro_max' ? initialTier : undefined)
  }, [user, initialized, initialTier])

  useEffect(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current
      // Cap the height at 500px as a reasonable max
      const newHeight = Math.min(container.scrollHeight, 500)
      container.style.height = `${newHeight}px`
    }
    // Smooth scroll to the new message
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

  function pushSystem(text: string, buttons?: ChatMessage['buttons'], content?: React.ReactNode, meta?: Record<string, any>) {
    setMessages((prev) => [...prev, { id: nextId(), sender: 'system', text, created_at: nowIso(), buttons, content, meta }])
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
          subject: 'Upgrade Request',
          metadata: { type: 'upgrade' },
        }),
      })
      const payload = await res.json()
      const id = payload?.conversation?.id as string | undefined
      if (!id) throw new Error('Missing conversation id')
      setConversationId(id)
      onConversationCreated?.(id)
      return id
    } catch (error) {
      console.error('Error creating upgrade conversation:', error)
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
      console.error('Error appending upgrade message:', error)
    }
  }

  async function systemAndLog(text: string, convId?: string | null, buttons?: ChatMessage['buttons'], content?: React.ReactNode, meta?: Record<string, any>) {
    pushSystem(text, buttons, content, meta)
    await appendMessage(text, 'system', convId)
  }

  async function startFlow(tier?: UpgradeTier) {
    const convId = await ensureConversation()
    
    if (!convId) {
      pushSystem('Unable to connect. Please refresh the page or try again later.', [], undefined, { error: true })
      return
    }

    setExpectingPhone(false)

    if (!tier) {
      await systemAndLog('Upgrade flow started. Step 1: choose a plan.', convId, [
        { label: `Pro (${(tierPrices['pro'] || 0).toLocaleString()} RWF)`, value: 'upgrade_select_pro' },
        { label: `Pro Max (${(tierPrices['pro_max'] || 0).toLocaleString()} RWF)`, value: 'upgrade_select_pro_max' },
      ])
      return
    }

    await selectTier(tier, convId)
  }

  async function selectTier(tier: UpgradeTier, convId?: string | null) {
    setSelectedTier(tier)
    const amount = tierPrices[tier] || 0
    const finalAmount = appliedDiscount ? amount - (amount * appliedDiscount) / 100 : amount
    const ussd = `*182*8*1*${momoPayCode}*${Math.ceil(finalAmount)}#`
    setCurrentUssd(ussd)
    const telLink = `tel:${ussd.replace(/#/g, '%23')}`

    const name = (user as any)?.full_name?.split(' ')[0] || (user as any)?.user_metadata?.full_name?.split(' ')[0] || 'User'

    const plainText = `Hello ${name}, You are going to upgrade your account to ${UPGRADE_LABELS[tier]} to earn more on FastEarn\n\nCategory: ${UPGRADE_LABELS[tier]}\nAmount: ${amount.toLocaleString()} RWF${appliedDiscount ? `\nDiscount: ${appliedDiscount}% (${Math.ceil((amount * appliedDiscount) / 100).toLocaleString()} RWF)\nFinal Amount: ${Math.ceil(finalAmount).toLocaleString()} RWF` : ''}\nMethod: MTN MOMO (${momoPayCode})\nDial: ${ussd}\n\nAfter payment, tap "I have paid".`

    const richContent = (
      <div className="space-y-3">
        <p><span className="text-emerald-500">Hey {name},</span>Send the final amount and select I have paid. Our agent may comfirm your payment</p>
        
        <div className="bg-black/20 p-3 rounded-lg space-y-1.5 text-sm font-mono border border-white/5">
          <div className="flex justify-between">
            <span className="text-gray-400">Category:</span>
            <span className="font-bold text-white">{UPGRADE_LABELS[tier]}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Original Amount:</span>
            <span className={`font-bold ${appliedDiscount ? 'text-gray-400 line-through' : 'text-emerald-400'}`}>{amount.toLocaleString()} RWF</span>
          </div>
          {appliedDiscount && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-400">Discount ({appliedDiscount}%):</span>
                <span className="font-bold text-green-400">-{Math.ceil((amount * appliedDiscount) / 100).toLocaleString()} RWF</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-1.5 mt-1">
                <span className="text-white">Final Amount:</span>
                <span className="font-bold text-white">{Math.ceil(finalAmount).toLocaleString()} RWF</span>
              </div>
            </>
          )}
          <div className="flex justify-between">
            <span className="text-gray-400">Method:</span>
            <span className="font-bold text-yellow-400">MTN MOMO ({momoPayCode})</span>
          </div>
          <div className="flex justify-between items-center gap-2 pt-2 border-t border-white/10 mt-1">
            <span className="text-gray-400">Dial:</span>
            <UssdCopy code={ussd} />
          </div>
          <a
            href={telLink}
            className="!mt-3 w-full text-center block bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded"
          >
            PAY
          </a>
        </div>

        <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2">
          <Info className="w-3 h-3 text-red-400" />
          <span>Send money on Momo pay, and select <span className="text-orange-300 font-semibold">I have paid</span> button below to continue.</span>
        </h3>
        {appliedPromoCode && (
          <p className="text-[5px] text-green-400/80">✓ <span className="text-amber-50"> Promo code "{appliedPromoCode}" applied</span></p>
        )}
      </div>
    )

    await systemAndLog(
      plainText,
      convId,
      [
        { label: 'I have paid', value: 'upgrade_paid' },
        { label: 'Change price', value: 'upgrade_change_plan' },
        { label: 'Need support', value: 'flow_support' },
      ],
      richContent,
      { payment: true, tier }
    )
  }

  async function handleButton(value?: string) {
    if (!value || sending) return

    if (value === 'flow_withdraw') {
      if (onSwitchFlow) onSwitchFlow('withdraw')
      return
    }

    if (value === 'flow_close') {
      window.location.assign(`/${locale}/dashboard`)
      return
    }

    if (value === 'upgrade_select_pro') {
      await selectTier('pro')
      return
    }

    if (value === 'upgrade_select_pro_max') {
      await selectTier('pro_max')
      return
    }

    if (value === 'upgrade_change_plan') {
      setExpectingPhone(false)
      pushSystem('Choose category:', [
        { label: `Pro (${(tierPrices['pro'] || 0).toLocaleString()} RWF)`, value: 'upgrade_select_pro' },
        { label: `Pro Max (${(tierPrices['pro_max'] || 0).toLocaleString()} RWF)`, value: 'upgrade_select_pro_max' },
      ])
      return
    }

    if (value === 'upgrade_paid') {
      setExpectingPhone(true)
      pushSystem('Hello, I am Fast-Earn agent. Enter the phone number used to pay.')
      return
    }

    if (value === 'flow_support') {
      if (onSwitchFlow) onSwitchFlow('support')
    }
  }

  async function handleSend() {
    if (!user || !input.trim() || !expectingPhone || sending || !selectedTier) return

    const phone = input.trim()
    setSending(true)
    setInput('')
    pushUser(phone)

    const convId = await ensureConversation()
    await appendMessage(phone, 'user', convId)

    if (!/^[0-9+]{8,15}$/.test(phone)) {
      await systemAndLog('Hmmm! This phone number looks invalid. Use digits with country code prefix.', convId)
      setExpectingPhone(true)
      setSending(false)
      return
    }

    await systemAndLog('Verifying your payment...', convId)

    try {
      const amount = tierPrices[selectedTier] || 0
      const res = await fetch('/api/upgrade-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          requestedTier: selectedTier,
          amount,
          paidPhone: phone,
          promoCode: appliedPromoCode,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'Failed to submit upgrade request')
      }

      await systemAndLog('Due to high payment volume this may take a while. We may comfirm the payment and upgrade your account shortly.', convId)
      setExpectingPhone(false)
      pushSystem('Need anything else?', [
        { label: 'Close', value: 'flow_close' },
        { label: 'Contact Support', value: 'flow_support' },
      ])
    } catch (error: any) {
      await systemAndLog(`Upgrade request failed: ${error?.message || 'Unknown error'}`, convId)
      setExpectingPhone(true)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-white/5 p-4 rounded-2xl border border-white/10">
      <div className="mb-4 pr-1 space-y-3">
      <div ref={messagesContainerRef} className="overflow-y-auto mb-4 pr-1 space-y-3 transition-[height] duration-300 ease-in-out">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[95%] px-4 py-3 rounded-2xl border ${
                m.sender === 'user'
                  ? 'bg-blue-600/30 border-blue-400/30 text-blue-50 rounded-br-md'
                  : 'bg-[#001b3d] border-blue-800/50 text-gray-100 rounded-bl-md'
              }`}
            >
              {m.content ? m.content : <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</p>}
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
        <p className="text-xs text-gray-400 mt-2">
          Select one of the suggested options above to continue.
        </p>
      )}
    </div>
    </div>
  )
}
