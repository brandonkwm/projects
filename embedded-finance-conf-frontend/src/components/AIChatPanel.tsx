import { useState, useRef, useEffect } from 'react'
import type { CategoryId, KycLevel } from '../types'
import type { Config } from '../types'

interface PartnerState {
  categoryId: CategoryId | null
  subCategoryId: string | null
  schemes: string[]
  geos: string[]
  kycLevel: KycLevel
  funding: string[]
}

interface ApplyConfig {
  categoryId?: CategoryId | null
  subCategoryId?: string | null
  schemes?: string[]
  geos?: string[]
  kycLevel?: KycLevel
  funding?: string[]
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

function parseAndApplyConfig(message: string, config: Config): { apply: ApplyConfig; reply: string } {
  const lower = message.toLowerCase()
  const apply: ApplyConfig = {}
  const updates: string[] = []

  const categoryMap: [string, CategoryId][] = [
    ['payment', 'payments'],
    ['payments', 'payments'],
    ['lending', 'lending'],
    ['credit', 'lending'],
    ['investment', 'investment'],
    ['invest', 'investment'],
    ['insurance', 'insurance'],
  ]
  for (const [keyword, id] of categoryMap) {
    if (lower.includes(keyword)) {
      apply.categoryId = id
      const cat = config.categories.find((c) => c.id === id)
      if (cat && !apply.subCategoryId) apply.subCategoryId = cat.subCategories[0]?.id ?? null
      updates.push(`category: ${cat?.label ?? id}`)
      break
    }
  }

  if (lower.includes('credit card') || lower.includes('card payment')) {
    apply.subCategoryId = 'credit_card'
    updates.push('sub-category: Credit card payments')
  }
  if (lower.includes('bank linkage') || lower.includes('bank account') || lower.includes('edda') || lower.includes('npp') || lower.includes('fps') || lower.includes('sepa') || lower.includes('ach')) {
    apply.subCategoryId = 'bank_linkage'
    updates.push('sub-category: Bank account linkages')
  }
  if (lower.includes('bnpl') || lower.includes('buy now pay later')) {
    apply.subCategoryId = 'bnpl'
    updates.push('sub-category: BNPL')
  }

  const schemeKeywords: [string, string][] = [
    ['edda', 'EDDA'],
    ['npp', 'NPP'],
    ['fps', 'FPS'],
    ['sepa', 'SEPA'],
    ['ach', 'ACH'],
  ]
  const detectedSchemes: string[] = []
  for (const [kw, id] of schemeKeywords) {
    if (lower.includes(kw)) detectedSchemes.push(id)
  }
  if (detectedSchemes.length) {
    apply.schemes = detectedSchemes
    updates.push(`schemes: ${detectedSchemes.join(', ')}`)
  }

  const geoKeywords: [string, string][] = [
    ['singapore', 'SG'],
    ['sg ', 'SG'],
    ['europe', 'EU'],
    ['eu ', 'EU'],
    ['uk ', 'UK'],
    ['united kingdom', 'UK'],
    ['us ', 'US'],
    ['united states', 'US'],
    ['australia', 'AU'],
    [' au ', 'AU'],
  ]
  const detectedGeos: string[] = []
  for (const [kw, id] of geoKeywords) {
    if (lower.includes(kw)) detectedGeos.push(id)
  }
  if (detectedGeos.length) {
    apply.geos = detectedGeos
    updates.push(`geos: ${detectedGeos.join(', ')}`)
  }

  if (lower.includes('full kyc') || lower.includes('full kyc')) apply.kycLevel = 'full'
  if (lower.includes('light kyc') || lower.includes('lite kyc')) apply.kycLevel = 'light'
  if (lower.includes('no kyc') || lower.includes('without kyc')) apply.kycLevel = 'none'
  if (apply.kycLevel) updates.push(`compliance: ${apply.kycLevel} KYC`)

  if (lower.includes('ach')) apply.funding = [...new Set([...(apply.funding || []), 'ach'])]
  if (lower.includes('sepa')) apply.funding = [...new Set([...(apply.funding || []), 'sepa'])]
  if (lower.includes('stablecoin') || lower.includes('crypto')) apply.funding = [...new Set([...(apply.funding || []), 'stablecoin'])]
  if (apply.funding?.length) updates.push(`funding: ${apply.funding.join(', ')}`)

  const reply =
    updates.length > 0
      ? `I've updated your configuration: ${updates.join('; ')}. You can refine any step in the form or ask me to change something else.`
      : "I didn't detect specific options in that message. Try saying e.g. \"I need payments with EDDA in Singapore and full KYC\" or \"Set lending, BNPL, EU and light KYC\"."
  return { apply, reply }
}

export default function AIChatPanel({
  open,
  onClose,
  config,
  onApply,
}: {
  open: boolean
  onClose: () => void
  config: Config
  partnerState?: PartnerState
  onApply: (updates: ApplyConfig) => void
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your configurator assistant. Tell me what you need—e.g. \"Payments with EDDA in Singapore and SEPA in EU, full KYC\"—and I'll set it up for you.",
    },
  ])
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function send() {
    const text = input.trim()
    if (!text) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', content: text }])

    const { apply, reply } = parseAndApplyConfig(text, config)
    if (Object.keys(apply).length > 0) {
      onApply(apply)
    }
    setMessages((m) => [...m, { role: 'assistant', content: reply }])
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      <div
        className="absolute inset-0 bg-black/50"
        aria-hidden
        onClick={onClose}
      />
      <div className="relative w-full max-w-md h-full sm:h-[80vh] sm:max-h-[600px] sm:rounded-t-2xl sm:mr-4 sm:mb-4 flex flex-col bg-slate-900 border border-slate-700 shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <span className="text-sm font-semibold text-slate-100">AI Configurator Assistant</span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
            >
              <div
                className={
                  msg.role === 'user'
                    ? 'max-w-[85%] rounded-2xl rounded-br-md bg-sky-600 text-slate-100 px-3 py-2 text-sm'
                    : 'max-w-[85%] rounded-2xl rounded-bl-md bg-slate-800 text-slate-200 px-3 py-2 text-sm'
                }
              >
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <div className="p-3 border-t border-slate-700">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              send()
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. Payments, EDDA and SEPA, Singapore and EU, full KYC"
              className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-sky-500 text-slate-950 font-medium text-sm hover:bg-sky-400"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
