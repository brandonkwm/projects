import { useMemo, useState } from 'react'

type BusinessType = 'marketplace' | 'saas' | 'gig'
type KycLevel = 'none' | 'light' | 'full'

const BUSINESS_TYPES: { id: BusinessType; label: string; description: string }[] = [
  { id: 'marketplace', label: 'Marketplace', description: 'Multi-sided platforms matching buyers and sellers.' },
  { id: 'saas', label: 'SaaS Platform', description: 'Vertical SaaS with embedded financial workflows.' },
  { id: 'gig', label: 'Gig Economy', description: 'On-demand work platforms paying out contractors.' },
]

const PRODUCTS = [
  { id: 'virtual_cards', label: 'Virtual Cards' },
  { id: 'wallets', label: 'Wallets' },
  { id: 'payouts', label: 'Payouts' },
]

const GEOS = [
  { id: 'US', label: 'US' },
  { id: 'EU', label: 'EU' },
  { id: 'SG', label: 'SG' },
]

const KYC_LEVELS: { id: KycLevel; label: string; description: string }[] = [
  { id: 'none', label: 'No KYC', description: 'Pseudo-anonymous usage for very low risk, low limits.' },
  { id: 'light', label: 'Light KYC', description: 'Name + address, suitable for low/medium risk use cases.' },
  { id: 'full', label: 'Full KYC', description: 'Document verification, higher limits and risk coverage.' },
]

const FUNDING = [
  { id: 'ach', label: 'ACH' },
  { id: 'sepa', label: 'SEPA' },
  { id: 'stablecoin', label: 'Stablecoins' },
]

function classNames(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

export default function App() {
  const [businessType, setBusinessType] = useState<BusinessType>('marketplace')
  const [products, setProducts] = useState<string[]>(['virtual_cards', 'payouts'])
  const [geos, setGeos] = useState<string[]>(['EU'])
  const [kycLevel, setKycLevel] = useState<KycLevel>('light')
  const [funding, setFunding] = useState<string[]>(['ach'])

  const toggleMulti = (value: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(value) ? list.filter((x) => x !== value) : [...list, value])
  }

  const spec = useMemo(() => {
    const productCount = products.length || 1
    const geoFactor = geos.length || 1
    const kycMultiplier = kycLevel === 'full' ? 1.4 : kycLevel === 'light' ? 1.2 : 1.0

    const setupFee = 5000 * productCount * geoFactor * 0.6 * kycMultiplier
    const monthlyFee = 1000 * productCount * geoFactor * kycMultiplier

    const baseWeeks =
      businessType === 'marketplace' ? 6 : businessType === 'gig' ? 5 : 4
    const kycWeeks = kycLevel === 'full' ? 3 : kycLevel === 'light' ? 2 : 1
    const fundingWeeks = funding.includes('stablecoin') ? 2 : 1
    const timeToLaunch = Math.max(2, baseWeeks + kycWeeks + fundingWeeks - 5)

    const endpoints: string[] = ['/v1/embed/partner', '/v1/embed/configuration']
    if (products.includes('virtual_cards')) endpoints.push('/v1/cards/virtual')
    if (products.includes('wallets')) endpoints.push('/v1/wallets')
    if (products.includes('payouts')) endpoints.push('/v1/payouts')

    const rationaleParts: string[] = []
    if (businessType === 'marketplace') {
      rationaleParts.push('Marketplaces typically need payouts to third-party sellers.')
    } else if (businessType === 'saas') {
      rationaleParts.push('Vertical SaaS often leads with wallets and virtual cards as add-on features.')
    } else {
      rationaleParts.push('Gig platforms prioritise fast, repeat payouts to workers.')
    }
    if (kycLevel === 'full') {
      rationaleParts.push('Full KYC enables higher limits and more complex card and wallet use cases.')
    } else if (kycLevel === 'light') {
      rationaleParts.push('Light KYC balances conversion with regulatory coverage for low/medium risk.')
    } else {
      rationaleParts.push('No KYC is only suitable for very low-value, low-risk scenarios.')
    }
    if (funding.includes('stablecoin')) {
      rationaleParts.push('Stablecoin funding adds cross-border flexibility but increases integration complexity.')
    }

    return {
      setupFee: Math.round(setupFee / 100) * 100,
      monthlyFee: Math.round(monthlyFee / 100) * 100,
      timeToLaunch,
      endpoints,
      rationale: rationaleParts.join(' '),
    }
  }, [businessType, products, geos, kycLevel, funding])

  return (
    <div className="min-h-screen flex text-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-black/60 border-r border-slate-800 flex flex-col shrink-0">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-800">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-sky-400 to-cyan-300 flex items-center justify-center">
            <span className="text-slate-950 font-black text-sm">Ef</span>
          </div>
          <span className="font-semibold tracking-tight">EmbedFlow</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'configurator', label: 'Configurator' },
            { id: 'specs', label: 'Specs' },
            { id: 'integrate', label: 'Integrate' },
          ].map((item) => {
            const active = item.id === 'configurator'
            return (
              <button
                key={item.id}
                type="button"
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

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-slate-800 flex items-center justify-between px-6 backdrop-blur bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="text-slate-300 font-medium">Configurator</span>
            <span>›</span>
            <span>Embedded finance flow</span>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="search"
              className="bg-slate-900/70 border border-slate-800 rounded-lg px-3 py-1.5 text-xs placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="Search partners, configs..."
              aria-label="Search"
            />
            <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-xs" aria-hidden>
              PM
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 flex flex-col gap-4 overflow-auto">
          <div className="flex items-center justify-between shrink-0">
            <div className="flex gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center text-xs font-semibold">
                  1
                </span>
                <span className="text-slate-300 font-medium">Business & Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center text-xs font-semibold">
                  2
                </span>
                <span className="text-slate-400">Products & Coverage</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center text-xs font-semibold">
                  3
                </span>
                <span className="text-slate-400">Review spec</span>
              </div>
            </div>
            <span className="text-xs text-slate-500">Partner-facing configurator · Demo</span>
          </div>

          <div className="grid grid-cols-12 gap-4 min-w-0">
            {/* Left: Business type & Products */}
            <section className="col-span-12 lg:col-span-5 space-y-4">
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 shadow-[0_18px_40px_rgba(15,23,42,0.85)]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-100">Business type</h2>
                    <p className="text-xs text-slate-500">Tailor the stack and risk controls to your model.</p>
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-slate-900 text-slate-400 border border-slate-800">
                    Step 1
                  </span>
                </div>
                <div className="space-y-2">
                  {BUSINESS_TYPES.map((bt) => {
                    const active = bt.id === businessType
                    return (
                      <button
                        key={bt.id}
                        type="button"
                        onClick={() => setBusinessType(bt.id)}
                        className={classNames(
                          'w-full flex flex-col items-start px-3 py-2.5 rounded-xl text-left border transition',
                          active
                            ? 'border-sky-400/70 bg-sky-500/10 shadow-[0_0_0_1px_rgba(56,189,248,0.3)]'
                            : 'border-slate-800 bg-slate-950/40 hover:border-slate-600'
                        )}
                      >
                        <span className="text-xs font-medium text-slate-100">{bt.label}</span>
                        <span className="text-[11px] text-slate-500 mt-0.5">{bt.description}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 shadow-[0_18px_40px_rgba(15,23,42,0.85)]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-100">Products</h2>
                    <p className="text-xs text-slate-500">Choose which modules you want to embed first.</p>
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/40">
                    Recommended
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {PRODUCTS.map((p) => {
                    const active = products.includes(p.id)
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggleMulti(p.id, products, setProducts)}
                        className={classNames(
                          'flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-[11px] font-medium border',
                          active
                            ? 'bg-sky-500 text-slate-950 border-sky-400'
                            : 'bg-slate-950/40 text-slate-400 border-slate-700 hover:border-slate-500'
                        )}
                      >
                        {p.label}
                      </button>
                    )
                  })}
                </div>
                <p className="mt-3 text-[11px] text-slate-500">
                  Stack flexibility: start with one module, expand over time without re-architecting.
                </p>
              </div>
            </section>

            {/* Middle: Geos & Funding */}
            <section className="col-span-12 lg:col-span-3 space-y-4">
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 shadow-[0_18px_40px_rgba(15,23,42,0.85)]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-100">Geos</h2>
                    <p className="text-xs text-slate-500">Where will you launch first?</p>
                  </div>
                  <span className="text-[10px] text-slate-500">Risk & coverage</span>
                </div>
                <div className="flex items-center justify-center mb-3">
                  <div className="h-24 w-24 rounded-full bg-sky-500/10 border border-sky-500/50 flex items-center justify-center text-xs text-sky-300">
                    {geos.length ? geos.join(' · ') : 'Select geos'}
                  </div>
                </div>
                <div className="flex justify-center gap-2 flex-wrap">
                  {GEOS.map((g) => {
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
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 shadow-[0_18px_40px_rgba(15,23,42,0.85)]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-100">Funding rails</h2>
                    <p className="text-xs text-slate-500">How will customers top up or fund spend?</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {FUNDING.map((f) => {
                    const active = funding.includes(f.id)
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => toggleMulti(f.id, funding, setFunding)}
                        className={classNames(
                          'w-full flex items-center justify-between px-3 py-2 rounded-xl border text-[11px]',
                          active
                            ? 'bg-emerald-500/10 border-emerald-400 text-emerald-200'
                            : 'bg-slate-950/40 border-slate-700 text-slate-400 hover:border-slate-500'
                        )}
                      >
                        <span>{f.label}</span>
                        {active && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            </section>

            {/* Right: Compliance & Spec */}
            <section className="col-span-12 lg:col-span-4 space-y-4">
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 shadow-[0_18px_40px_rgba(15,23,42,0.85)]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-100">Compliance depth</h2>
                    <p className="text-xs text-slate-500">Align KYC/AML requirements with your risk appetite.</p>
                  </div>
                  <span className="text-[10px] text-slate-500">KYC · KYB</span>
                </div>
                <div className="space-y-2">
                  {KYC_LEVELS.map((k) => {
                    const active = k.id === kycLevel
                    return (
                      <button
                        key={k.id}
                        type="button"
                        onClick={() => setKycLevel(k.id)}
                        className={classNames(
                          'w-full flex flex-col items-start px-3 py-2.5 rounded-xl border text-left',
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
              </div>

              <div className="bg-slate-950/80 border border-slate-700 rounded-2xl p-4 shadow-[0_18px_40px_rgba(15,23,42,0.85)]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-100">Generated spec summary</h2>
                    <p className="text-xs text-slate-500">Share this with your technical and compliance teams.</p>
                  </div>
                  <span className="text-[10px] text-emerald-300 bg-emerald-500/10 border border-emerald-400/50 rounded-full px-2 py-1">
                    Ready to review
                  </span>
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
                      <div className="mt-0.5 text-sky-300">{spec.timeToLaunch}–{spec.timeToLaunch + 1} weeks</div>
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
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
