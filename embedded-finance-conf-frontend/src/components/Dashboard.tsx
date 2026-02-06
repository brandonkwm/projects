/**
 * Dashboard: performance metrics and activity for the partner's embedded finance setup.
 * Demo data for portfolio; no backend.
 */

export interface DashboardOverview {
  summary: string // e.g. "Virtual Cards + SEPA active"
  goLiveWeeks: number
  estRevenueMonthly: number // $
}

const MOCK_METRICS = {
  activeUsers: 1247,
  activeUsersPrev: 1100,
  cardsIssued: 3892,
  cardsIssuedPrev: 3200,
  volumeProcessed: 2847500,
  volumePrev: 2510000,
  txCount: 42890,
  txCountPrev: 38100,
  fundingAch: 62,
  fundingSepa: 38,
  authSuccessRate: 98.2,
  disputeRate: 0.4,
}

const MOCK_ACTIVITY = [
  { id: '1', time: '2 min ago', type: 'card', text: 'New virtual card issued · ****4521', icon: '💳' },
  { id: '2', time: '15 min ago', type: 'payout', text: 'Payout batch completed · 124 txns · €12.4k', icon: '📤' },
  { id: '3', time: '1 hr ago', type: 'card', text: 'Card spend limit updated · Corp tier', icon: '💳' },
  { id: '4', time: '2 hrs ago', type: 'system', text: 'Daily reconciliation completed · All clear', icon: '✓' },
  { id: '5', time: '5 hrs ago', type: 'payout', text: 'SEPA credit batch sent · 89 beneficiaries', icon: '📤' },
]

const MOCK_ALERTS = [
  { id: 'a1', severity: 'warning', text: 'Low ACH balance — top up recommended to avoid failed payouts.', cta: 'Top up' },
  { id: 'a2', severity: 'info', text: 'Compliance review due in 14 days for EU entity.', cta: 'Review' },
]

function BarChart({
  label,
  value,
  max,
  format,
  color = 'sky',
}: {
  label: string
  value: number
  max: number
  format: (n: number) => string
  color?: 'sky' | 'emerald' | 'amber'
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  const colorBg =
    color === 'sky' ? 'bg-sky-500' : color === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500'
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-200 font-medium">{format(value)}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full ${colorBg} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function Dashboard({ overview }: { overview?: DashboardOverview | null }) {
  const defaultOverview: DashboardOverview = {
    summary: 'Virtual Cards + SEPA active',
    goLiveWeeks: 2,
    estRevenueMonthly: 5000,
  }
  const ov = overview ?? defaultOverview

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Welcome / Overview Card */}
      <section className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700 rounded-2xl p-5 shadow-[0_18px_40px_rgba(15,23,42,0.85)]">
        <h1 className="text-lg font-semibold text-slate-100 mb-1">Welcome back</h1>
        <p className="text-sm text-slate-300 mb-4">
          {ov.summary}; <span className="text-sky-300">{ov.goLiveWeeks}-week go-live</span>; Est.{' '}
          <span className="text-emerald-300 font-medium">${(ov.estRevenueMonthly / 1000).toFixed(1)}k/mo</span> revenue.
        </p>
        <div className="flex flex-wrap gap-3 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40">
            Live
          </span>
          <span className="px-2.5 py-1 rounded-full bg-slate-700 text-slate-400">Last synced: just now</span>
        </div>
      </section>

      {/* Performance Metrics */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-100">Performance metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">Active users</p>
            <p className="text-2xl font-semibold text-slate-100">
              {MOCK_METRICS.activeUsers.toLocaleString()}
            </p>
            <p className="text-xs text-emerald-400 mt-0.5">
              +{((MOCK_METRICS.activeUsers - MOCK_METRICS.activeUsersPrev) / MOCK_METRICS.activeUsersPrev * 100).toFixed(1)}% vs last period
            </p>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">Cards issued</p>
            <p className="text-2xl font-semibold text-slate-100">
              {MOCK_METRICS.cardsIssued.toLocaleString()}
            </p>
            <p className="text-xs text-emerald-400 mt-0.5">
              +{((MOCK_METRICS.cardsIssued - MOCK_METRICS.cardsIssuedPrev) / MOCK_METRICS.cardsIssuedPrev * 100).toFixed(1)}% vs last period
            </p>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">Volume processed</p>
            <p className="text-2xl font-semibold text-slate-100">
              ${(MOCK_METRICS.volumeProcessed / 1e6).toFixed(2)}M
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {MOCK_METRICS.txCount.toLocaleString()} txns
            </p>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">Key rates</p>
            <p className="text-slate-200 font-medium">Auth success <span className="text-emerald-400">{MOCK_METRICS.authSuccessRate}%</span></p>
            <p className="text-slate-200 font-medium mt-0.5">Dispute <span className="text-amber-400">{MOCK_METRICS.disputeRate}%</span></p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <p className="text-xs font-medium text-slate-300 mb-3">Funding inflows (ACH vs SEPA)</p>
            <div className="space-y-3">
              <BarChart
                label="ACH"
                value={MOCK_METRICS.fundingAch}
                max={100}
                format={(n) => `${n}%`}
                color="sky"
              />
              <BarChart
                label="SEPA"
                value={MOCK_METRICS.fundingSepa}
                max={100}
                format={(n) => `${n}%`}
                color="emerald"
              />
            </div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <p className="text-xs font-medium text-slate-300 mb-3">Volume vs transactions (indexed)</p>
            <div className="space-y-3">
              <BarChart
                label="Volume ($)"
                value={MOCK_METRICS.volumeProcessed}
                max={3e6}
                format={(n) => `$${(n / 1e6).toFixed(2)}M`}
                color="sky"
              />
              <BarChart
                label="Tx count"
                value={MOCK_METRICS.txCount}
                max={50000}
                format={(n) => n.toLocaleString()}
                color="emerald"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Recent Activity + Alerts */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-slate-950/60 border border-slate-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-slate-100 mb-3">Recent activity</h2>
          <ul className="space-y-0">
            {MOCK_ACTIVITY.map((item) => (
              <li
                key={item.id}
                className="flex items-start gap-3 py-2.5 border-b border-slate-800/80 last:border-0"
              >
                <span className="text-base shrink-0" aria-hidden>{item.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-200">{item.text}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{item.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-slate-100 mb-3">Alerts</h2>
          <ul className="space-y-2">
            {MOCK_ALERTS.map((a) => (
              <li
                key={a.id}
                className={`
                  rounded-lg border p-3
                  ${a.severity === 'warning' ? 'bg-amber-500/10 border-amber-500/40' : 'bg-sky-500/10 border-sky-500/40'}
                `}
              >
                <p className="text-xs text-slate-200">{a.text}</p>
                <button
                  type="button"
                  className="mt-2 text-[11px] font-medium text-sky-300 hover:text-sky-200"
                >
                  {a.cta} →
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
