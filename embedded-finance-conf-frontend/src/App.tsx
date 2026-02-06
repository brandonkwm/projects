import { useMemo, useState } from 'react'
import { useConfig } from './context/ConfigContext'
import AIChatPanel from './components/AIChatPanel'
import Dashboard from './components/Dashboard'
import ProviderView from './components/ProviderView'
import type { CategoryId, KycLevel } from './types'

function classNames(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

function StepBadge({ step }: { step: number }) {
  return (
    <span className="shrink-0 text-[10px] font-medium px-2 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
      Step {step}
    </span>
  )
}

type NavId = 'dashboard' | 'configurator' | 'specs' | 'integrate'

export default function App() {
  const { config } = useConfig()
  const [activeNav, setActiveNav] = useState<NavId>('configurator')
  const [viewMode, setViewMode] = useState<'partner' | 'provider'>('partner')
  const [aiChatOpen, setAiChatOpen] = useState(false)

  const [categoryId, setCategoryId] = useState<CategoryId | null>('payments')
  const [subCategoryId, setSubCategoryId] = useState<string | null>('credit_card')
  const [schemes, setSchemes] = useState<string[]>([])
  const [geos, setGeos] = useState<string[]>(['EU'])
  const [kycLevel, setKycLevel] = useState<KycLevel>('light')
  const [funding, setFunding] = useState<string[]>(['ach'])

  const category = useMemo(() => config.categories.find((c) => c.id === categoryId), [config.categories, categoryId])
  const subCategory = useMemo(
    () => category?.subCategories.find((s) => s.id === subCategoryId),
    [category, subCategoryId]
  )
  const showSchemes = categoryId === 'payments' && subCategoryId === 'bank_linkage' && subCategory?.schemes

  const stepNumbers = useMemo(
    () => ({
      category: 1,
      subCategory: 2,
      schemes: showSchemes ? 3 : 0,
      geos: showSchemes ? 4 : 3,
      compliance: showSchemes ? 5 : 4,
      funding: showSchemes ? 6 : 5,
      spec: showSchemes ? 7 : 6,
    }),
    [showSchemes]
  )

  const toggleMulti = (value: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(value) ? list.filter((x) => x !== value) : [...list, value])
  }

  function applyAiConfig(updates: {
    categoryId?: CategoryId | null
    subCategoryId?: string | null
    schemes?: string[]
    geos?: string[]
    kycLevel?: KycLevel
    funding?: string[]
  }) {
    if (updates.categoryId !== undefined) setCategoryId(updates.categoryId)
    if (updates.subCategoryId !== undefined) setSubCategoryId(updates.subCategoryId)
    if (updates.schemes !== undefined) setSchemes(updates.schemes)
    if (updates.geos !== undefined) setGeos(updates.geos)
    if (updates.kycLevel !== undefined) setKycLevel(updates.kycLevel)
    if (updates.funding !== undefined) setFunding(updates.funding)
  }

  const spec = useMemo(() => {
    const p = config.pricing
    const geoCount = geos.length || 1
    const schemeCount = showSchemes ? Math.max(schemes.length, 1) : 1
    const kycMult =
      kycLevel === 'full' ? p.kycMultiplierFull : kycLevel === 'light' ? p.kycMultiplierLight : p.kycMultiplierNone

    const setupFee =
      (p.baseSetup + (geoCount - 1) * p.perGeoSetup + (showSchemes ? (schemeCount - 1) * p.perSchemeSetup : 0)) * kycMult
    const monthlyFee =
      (p.baseMonthly + (geoCount - 1) * p.perGeoMonthly + (showSchemes ? (schemeCount - 1) * p.perSchemeMonthly : 0)) * kycMult

    const baseWeeks = categoryId === 'payments' ? 4 : categoryId === 'lending' ? 6 : 5
    const kycWeeks = kycLevel === 'full' ? 3 : kycLevel === 'light' ? 2 : 1
    const timeToLaunch = Math.max(2, baseWeeks + kycWeeks - 2)

    const endpoints: string[] = ['/v1/embed/partner', '/v1/embed/configuration']
    if (categoryId === 'payments') {
      endpoints.push('/v1/payments')
      if (subCategoryId === 'bank_linkage') endpoints.push('/v1/payments/bank-linkage')
      if (subCategoryId === 'credit_card') endpoints.push('/v1/payments/cards')
    }
    if (categoryId === 'lending') endpoints.push('/v1/lending')
    if (categoryId === 'investment') endpoints.push('/v1/investment')
    if (categoryId === 'insurance') endpoints.push('/v1/insurance')

    const rationaleParts: string[] = []
    if (category?.label) rationaleParts.push(`${category.label}`)
    if (subCategory?.label) rationaleParts.push(`with ${subCategory.label}.`)
    if (showSchemes && schemes.length) {
      rationaleParts.push(`Selected schemes: ${schemes.join(', ')}.`)
    }
    if (kycLevel === 'full') {
      rationaleParts.push('Full KYC enables higher limits and broader use cases.')
    } else if (kycLevel === 'light') {
      rationaleParts.push('Light KYC balances conversion with regulatory coverage.')
    } else {
      rationaleParts.push('No KYC is suitable only for very low-value, low-risk scenarios.')
    }
    if (funding.includes('stablecoin')) {
      rationaleParts.push('Stablecoin funding adds cross-border flexibility.')
    }

    return {
      setupFee: Math.round(setupFee / 100) * 100,
      monthlyFee: Math.round(monthlyFee / 100) * 100,
      timeToLaunch,
      endpoints,
      rationale: rationaleParts.join(' '),
    }
  }, [config.pricing, categoryId, subCategoryId, subCategory, category, showSchemes, schemes, geos, kycLevel, funding])

  return (
    <div className="min-h-screen flex text-slate-50">
      <aside className="w-64 bg-black/60 border-r border-slate-800 flex flex-col shrink-0">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-800">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-sky-400 to-cyan-300 flex items-center justify-center">
            <span className="text-slate-950 font-black text-sm">Ef</span>
          </div>
          <span className="font-semibold tracking-tight">EmbedFlow</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {[
            { id: 'dashboard' as const, label: 'Dashboard' },
            { id: 'configurator' as const, label: 'Configurator' },
            { id: 'specs' as const, label: 'Specs' },
            { id: 'integrate' as const, label: 'Integrate' },
          ].map((item) => {
            const active = item.id === activeNav
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveNav(item.id)}
                className={classNames(
                  'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm',
                  active
                    ? 'bg-slate-800 text-slate-50 shadow-inner shadow-slate-900'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                )}
              >
                <span>{item.label}</span>
                {active && <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />}
              </button>
            )
          })}
        </nav>
        <div className="px-4 py-4 border-t border-slate-800 text-xs text-slate-500">
          Prototype · Embedded finance configurator
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-slate-800 flex items-center justify-between px-6 backdrop-blur bg-slate-950/40 shrink-0 flex-wrap gap-2">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="text-slate-300 font-medium">
              {activeNav === 'dashboard' ? 'Dashboard' : activeNav === 'configurator' ? 'Configurator' : activeNav === 'specs' ? 'Specs' : 'Integrate'}
            </span>
            {activeNav === 'configurator' && (
              <>
                <span>›</span>
                <span>{viewMode === 'partner' ? 'Partner view' : 'Service provider view'}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg border border-slate-700 p-0.5 bg-slate-900/70">
              <button
                type="button"
                onClick={() => setViewMode('partner')}
                className={classNames(
                  'px-3 py-1.5 rounded-md text-xs font-medium',
                  viewMode === 'partner' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-slate-100'
                )}
              >
                Partner
              </button>
              <button
                type="button"
                onClick={() => setViewMode('provider')}
                className={classNames(
                  'px-3 py-1.5 rounded-md text-xs font-medium',
                  viewMode === 'provider' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-slate-100'
                )}
              >
                Service provider
              </button>
            </div>
            {viewMode === 'partner' && activeNav === 'configurator' && (
              <button
                type="button"
                onClick={() => setAiChatOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-medium hover:bg-violet-500"
              >
                <span aria-hidden>💬</span> Talk to AI
              </button>
            )}
            <input
              type="search"
              className="bg-slate-900/70 border border-slate-800 rounded-lg px-3 py-1.5 text-xs placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="Search..."
              aria-label="Search"
            />
            <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-xs" aria-hidden>
              PM
            </div>
          </div>
        </header>

        {activeNav === 'dashboard' && (
          <div className="flex-1 overflow-auto">
            <Dashboard
              overview={
                category && subCategory
                  ? {
                      summary: [category.label, subCategory.label].join(' + ') + (funding.length ? ` · ${config.funding.filter((f) => funding.includes(f.id)).map((f) => f.label).join(', ')}` : ''),
                      goLiveWeeks: spec.timeToLaunch,
                      estRevenueMonthly: spec.monthlyFee * 2,
                    }
                  : undefined
              }
            />
          </div>
        )}

        {activeNav === 'specs' && (
          <div className="flex-1 p-6 overflow-auto max-w-3xl">
            <p className="text-sm text-slate-400">Generated specs and documentation will appear here. Use the Configurator to build a spec, then export PDF or open API docs.</p>
          </div>
        )}

        {activeNav === 'integrate' && (
          <div className="flex-1 p-6 overflow-auto max-w-3xl">
            <p className="text-sm text-slate-400">Integration guides, SDKs, and sandbox credentials. Connect your app to the embedded finance APIs from the Configurator spec.</p>
          </div>
        )}

        {activeNav === 'configurator' && (viewMode === 'provider' ? (
          <div className="flex-1 p-6 overflow-auto">
            <ProviderView />
          </div>
        ) : (
          <div className="flex-1 p-6 overflow-auto">
            <div className="flex flex-wrap gap-4 mb-6 text-sm text-slate-400">
              {[
                { n: 1, label: 'Category' },
                { n: 2, label: 'Sub-category' },
                ...(showSchemes ? [{ n: 3, label: 'Schemes' }] : []),
                { n: stepNumbers.geos, label: 'Geos' },
                { n: stepNumbers.compliance, label: 'Compliance' },
                { n: stepNumbers.funding, label: 'Funding' },
                { n: stepNumbers.spec, label: 'Spec' },
              ].map(({ n, label }) => (
                <span key={label} className="flex items-center gap-1.5">
                  <span className="h-6 w-6 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center text-xs font-semibold">
                    {n}
                  </span>
                  <span>{label}</span>
                </span>
              ))}
            </div>

            <div className="max-w-3xl flex flex-col gap-6">
              {/* Step 1: Category */}
              <section className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 shadow-[0_18px_40px_rgba(15,23,42,0.85)]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-100">Category</h2>
                    <p className="text-xs text-slate-500">Choose the embedded finance category you want to offer.</p>
                  </div>
                  <StepBadge step={stepNumbers.category} />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {config.categories.map((c) => {
                    const active = categoryId === c.id
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setCategoryId(c.id)
                          const first = c.subCategories[0]
                          setSubCategoryId(first?.id ?? null)
                          if (c.id !== 'payments' || first?.id !== 'bank_linkage') setSchemes([])
                        }}
                        className={classNames(
                          'flex flex-col items-start px-3 py-2.5 rounded-xl text-left border transition',
                          active
                            ? 'border-sky-400/70 bg-sky-500/10 shadow-[0_0_0_1px_rgba(56,189,248,0.3)]'
                            : 'border-slate-800 bg-slate-950/40 hover:border-slate-600'
                        )}
                      >
                        <span className="text-xs font-medium text-slate-100">{c.label}</span>
                        <span className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{c.description}</span>
                      </button>
                    )
                  })}
                </div>
              </section>

              {/* Step 2: Sub-category */}
              {category && (
                <section className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 shadow-[0_18px_40px_rgba(15,23,42,0.85)]">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-100">Sub-category</h2>
                      <p className="text-xs text-slate-500">Narrow down how you want to embed this capability.</p>
                    </div>
                    <StepBadge step={stepNumbers.subCategory} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {category.subCategories.map((s) => {
                      const active = subCategoryId === s.id
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setSubCategoryId(s.id)
                            if (s.id !== 'bank_linkage') setSchemes([])
                          }}
                          className={classNames(
                            'flex flex-col items-start px-3 py-2.5 rounded-xl text-left border transition min-w-[140px]',
                            active
                              ? 'border-sky-400/70 bg-sky-500/10 shadow-[0_0_0_1px_rgba(56,189,248,0.3)]'
                              : 'border-slate-800 bg-slate-950/40 hover:border-slate-600'
                          )}
                        >
                          <span className="text-xs font-medium text-slate-100">{s.label}</span>
                          {s.description && (
                            <span className="text-[11px] text-slate-500 mt-0.5">{s.description}</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* Step 3: Schemes */}
              {showSchemes && subCategory?.schemes && (
                <section className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 shadow-[0_18px_40px_rgba(15,23,42,0.85)]">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-100">Payment schemes</h2>
                      <p className="text-xs text-slate-500">
                        Select bank linkage schemes (e.g. EDDA in SG, NPP in AU, FPS in UK).
                      </p>
                    </div>
                    <StepBadge step={stepNumbers.schemes} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {subCategory.schemes.map((sch) => {
                      const active = schemes.includes(sch.id)
                      return (
                        <button
                          key={sch.id}
                          type="button"
                          onClick={() => toggleMulti(sch.id, schemes, setSchemes)}
                          className={classNames(
                            'px-3 py-2 rounded-xl text-[11px] font-medium border',
                            active
                              ? 'bg-sky-500 text-slate-950 border-sky-400'
                              : 'bg-slate-950/40 text-slate-400 border-slate-700 hover:border-slate-500'
                          )}
                        >
                          {sch.label} ({sch.geo})
                        </button>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* Step 4: Geos */}
              <section className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 shadow-[0_18px_40px_rgba(15,23,42,0.85)]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-100">Geos</h2>
                    <p className="text-xs text-slate-500">Where will you launch?</p>
                  </div>
                  <StepBadge step={stepNumbers.geos} />
                </div>
                <div className="flex flex-wrap gap-2">
                  {config.geos.map((g) => {
                    const active = geos.includes(g.id)
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => toggleMulti(g.id, geos, setGeos)}
                        className={classNames(
                          'px-2.5 py-1.5 rounded-full text-[11px] border',
                          active
                            ? 'bg-slate-100 text-slate-900 border-slate-100'
                            : 'bg-slate-950/40 text-slate-400 border-slate-700 hover:border-slate-500'
                        )}
                      >
                        {g.label}
                      </button>
                    )
                  })}
                </div>
              </section>

              {/* Step 5: Compliance */}
              <section className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 shadow-[0_18px_40px_rgba(15,23,42,0.85)]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-100">Compliance depth</h2>
                    <p className="text-xs text-slate-500">Align KYC/AML requirements with your risk appetite.</p>
                  </div>
                  <StepBadge step={stepNumbers.compliance} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {config.kycLevels.map((k) => {
                    const active = kycLevel === k.id
                    return (
                      <button
                        key={k.id}
                        type="button"
                        onClick={() => setKycLevel(k.id)}
                        className={classNames(
                          'flex flex-col items-start px-3 py-2.5 rounded-xl border text-left',
                          active
                            ? 'bg-indigo-500/10 border-indigo-400 text-slate-100'
                            : 'bg-slate-950/40 border-slate-700 text-slate-400 hover:border-slate-500'
                        )}
                      >
                        <span className="text-xs font-medium">{k.label}</span>
                        <span className="text-[11px] text-slate-500 mt-0.5">{k.description}</span>
                      </button>
                    )
                  })}
                </div>
              </section>

              {/* Step 6: Funding */}
              <section className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 shadow-[0_18px_40px_rgba(15,23,42,0.85)]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-100">Funding rails</h2>
                    <p className="text-xs text-slate-500">How will customers top up or fund spend?</p>
                  </div>
                  <StepBadge step={stepNumbers.funding} />
                </div>
                <div className="flex flex-wrap gap-2">
                  {config.funding.map((f) => {
                    const active = funding.includes(f.id)
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => toggleMulti(f.id, funding, setFunding)}
                        className={classNames(
                          'px-3 py-2 rounded-xl text-[11px] font-medium border',
                          active
                            ? 'bg-emerald-500/10 border-emerald-400 text-emerald-200'
                            : 'bg-slate-950/40 border-slate-700 text-slate-400 hover:border-slate-500'
                        )}
                      >
                        {f.label}
                      </button>
                    )
                  })}
                </div>
              </section>

              {/* Step 7: Generated spec summary */}
              <section className="bg-slate-950/80 border border-slate-700 rounded-2xl p-4 shadow-[0_18px_40px_rgba(15,23,42,0.85)]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-100">Generated spec summary</h2>
                    <p className="text-xs text-slate-500">Share this with your technical and compliance teams.</p>
                  </div>
                  <StepBadge step={stepNumbers.spec} />
                </div>
                <div className="text-[11px] space-y-2 text-slate-400">
                  <div>
                    <span className="font-semibold text-slate-300">API endpoints:</span>{' '}
                    <span className="font-mono text-[10px] break-all">{spec.endpoints.join(', ')}</span>
                  </div>
                  <div className="flex gap-4 flex-wrap">
                    <div>
                      <span className="font-semibold text-slate-300">Cost estimate</span>
                      <div className="mt-0.5">
                        Setup: <span className="text-sky-300">${spec.setupFee.toLocaleString()}</span> · Monthly:{' '}
                        <span className="text-sky-300">${spec.monthlyFee.toLocaleString()}</span>
                      </div>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-300">Time to launch</span>
                      <div className="mt-0.5 text-sky-300">
                        {spec.timeToLaunch}–{spec.timeToLaunch + 1} weeks
                      </div>
                    </div>
                  </div>
                  <p className="mt-1 leading-snug">{spec.rationale}</p>
                </div>
                <div className="mt-4 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-[11px] text-slate-100 hover:border-slate-500"
                    >
                      PDF spec
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-full bg-sky-500 text-[11px] text-slate-950 font-medium hover:bg-sky-400"
                    >
                      API docs
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-500">Non-binding · For discovery & planning</span>
                </div>
              </section>
            </div>
          </div>
        ))}

        <AIChatPanel
          open={aiChatOpen}
          onClose={() => setAiChatOpen(false)}
          config={config}
          partnerState={{
            categoryId,
            subCategoryId,
            schemes,
            geos,
            kycLevel,
            funding,
          }}
          onApply={applyAiConfig}
        />
      </main>
    </div>
  )
}
