const reasonLabels = {
  retrenchment: 'Retrenchment / Lay-off',
  reduced_income: 'Significant reduction in income',
  medical: 'Medical emergency / hospitalisation',
  debt: 'Severe financial debt',
  other: 'Other reasons',
}

// Current window constants
const REMAINING_MONTHS = 7
const REMAINING_BALANCE = 3000
const CURRENT_MONTHLY = 500
const TOTAL_MONTHS = 12
const MONTHS_PAID = 5

// Next window assumptions — $550/month is a flat assumption; actual figure confirmed upon YA 2026 assessment
const NEXT_WINDOW_MONTHLY_BASE = 550
const NEXT_WINDOW_MONTHS = 12

function TimelineBar({ label, year, segments, total, deferredLabel }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-xs font-semibold text-gray-600 w-16 shrink-0">{year}</span>
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <div className="flex gap-0.5 h-8 rounded overflow-hidden">
        {segments.map((seg, i) => (
          <div
            key={i}
            style={{ width: `${(seg.months / total) * 100}%`, backgroundColor: seg.color }}
            className="flex items-center justify-center"
            title={seg.tooltip}
          >
            {seg.months >= 2 && (
              <span className="text-white text-xs font-semibold px-1 truncate">{seg.label}</span>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-0.5 mt-0.5">
        {segments.map((seg, i) => (
          <div key={i} style={{ width: `${(seg.months / total) * 100}%` }}>
            <span className="text-xs text-gray-400">{seg.sublabel}</span>
          </div>
        ))}
      </div>
      {deferredLabel && (
        <p className="text-xs text-orange font-medium mt-1 ml-16">{deferredLabel}</p>
      )}
    </div>
  )
}

export default function Step2Review({ data, onBack, onSubmit }) {
  const newMonthly = Number(data.newMonthlyAmount)
  const newWindowTotal = newMonthly * REMAINING_MONTHS
  const deferred = REMAINING_BALANCE - newWindowTotal

  const nextWindowBase = NEXT_WINDOW_MONTHLY_BASE
  const deferredMonthly = deferred / NEXT_WINDOW_MONTHS
  const nextWindowCombined = nextWindowBase + deferredMonthly

  // YA 2025 segments
  const ya2025Segments = [
    {
      months: MONTHS_PAID,
      color: '#1B3A6B',
      label: `$${CURRENT_MONTHLY}/mo`,
      sublabel: `Jan–May`,
      tooltip: `Months 1–5: $500/month (paid)`,
    },
    {
      months: REMAINING_MONTHS,
      color: '#E85B04',
      label: `$${newMonthly}/mo`,
      sublabel: `Jun–Dec`,
      tooltip: `Months 6–12: $${newMonthly}/month (adjusted)`,
    },
  ]

  // YA 2026 segments
  const ya2026Segments = [
    {
      months: NEXT_WINDOW_MONTHS,
      color: '#0F7B6C',
      label: `$${nextWindowBase.toFixed(0)}/mo base`,
      sublabel: '',
      tooltip: `Base monthly: $${nextWindowBase.toFixed(2)}`,
    },
  ]

  const ya2026WithDeferralSegments = [
    {
      months: NEXT_WINDOW_MONTHS,
      color: '#0F7B6C',
      label: `$${nextWindowBase.toFixed(0)}/mo`,
      sublabel: 'Base tax',
      tooltip: `Base: $${nextWindowBase.toFixed(2)}/month`,
    },
    {
      months: NEXT_WINDOW_MONTHS,
      color: '#F59E0B',
      label: `+$${deferredMonthly.toFixed(0)}/mo`,
      sublabel: 'Deferred',
      tooltip: `Deferred carry-over: $${deferredMonthly.toFixed(2)}/month`,
    },
  ]

  return (
    <div className="max-w-2xl mx-auto">
      {/* Summary of request */}
      <div className="bg-white border border-iras-border rounded px-6 py-5 mb-5">
        <h3 className="text-sm font-semibold text-navy mb-4">Your Adjustment Request Summary</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Year of Assessment</span>
            <span className="font-medium text-gray-800">YA 2025</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Current monthly instalment</span>
            <span className="font-medium text-gray-800">$500.00</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">New monthly instalment</span>
            <span className="font-bold text-navy">${newMonthly.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Months remaining (Jun–Dec 2026)</span>
            <span className="font-medium text-gray-800">{REMAINING_MONTHS} months</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Total paid under new plan (this window)</span>
            <span className="font-medium text-gray-800">${newWindowTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Amount deferred to YA 2026</span>
            <span className="font-bold text-orange">${deferred.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Reason</span>
            <span className="font-medium text-gray-800">{reasonLabels[data.reason] || data.reason}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500">Supporting document</span>
            <span className="font-medium text-gray-800">
              {data.uploadedFile ? (
                <span className="flex items-center gap-1 text-teal">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {data.uploadedFile.name}
                </span>
              ) : (
                <span className="text-gray-400 italic">None uploaded</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Deferral visualisation */}
      <div className="bg-white border border-iras-border rounded px-6 py-5 mb-5">
        <h3 className="text-sm font-semibold text-navy mb-1">How the Deferral Works</h3>
        <p className="text-xs text-gray-500 mb-5">
          The shortfall from your reduced payments will carry over and be added on top of your YA 2026 instalments.
        </p>

        {/* YA 2025 — timeline bar (width = months, correct metaphor) */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">YA 2025 (Current Window)</span>
            <span className="text-xs text-gray-500">12 months total</span>
          </div>
          <div className="flex h-9 rounded-md overflow-hidden">
            <div
              style={{ width: `${(MONTHS_PAID / TOTAL_MONTHS) * 100}%` }}
              className="bg-navy flex items-center justify-center"
            >
              <span className="text-white text-xs font-semibold">$500/mo ×{MONTHS_PAID}</span>
            </div>
            <div
              style={{ width: `${(REMAINING_MONTHS / TOTAL_MONTHS) * 100}%` }}
              className="bg-orange flex items-center justify-center"
            >
              <span className="text-white text-xs font-semibold">${newMonthly}/mo ×{REMAINING_MONTHS}</span>
            </div>
          </div>
          <div className="flex text-xs mt-1">
            <div style={{ width: `${(MONTHS_PAID / TOTAL_MONTHS) * 100}%` }} className="text-gray-400">Jan–May (paid)</div>
            <div style={{ width: `${(REMAINING_MONTHS / TOTAL_MONTHS) * 100}%` }} className="text-orange font-medium">Jun–Dec (adjusted)</div>
          </div>
        </div>

        {/* Deferred carry-over arrow */}
        <div className="flex items-center gap-2 my-4">
          <div className="flex-1 border-t-2 border-dashed border-orange/40" />
          <div className="text-center px-2">
            <div className="text-orange font-bold text-sm">${deferred.toFixed(2)} deferred</div>
            <div className="text-xs text-gray-400">carries over into YA 2026 ↓</div>
          </div>
          <div className="flex-1 border-t-2 border-dashed border-orange/40" />
        </div>

        {/* YA 2026 — per-month stacked breakdown (not a timeline) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">YA 2026 (Next Window)</span>
            <span className="text-xs text-gray-400 italic">applied every month</span>
          </div>
          <div className="rounded-md overflow-hidden border border-iras-border">
            <div className="flex items-center px-4 py-3 bg-teal/5 border-b border-iras-border">
              <div className="w-3 h-3 rounded-sm bg-teal mr-3 shrink-0" />
              <span className="text-sm text-gray-700 flex-1">Estimated base tax <span className="text-gray-400 text-xs">(assumed $550/mo)</span></span>
              <span className="text-sm font-semibold text-teal">${nextWindowBase.toFixed(2)}</span>
            </div>
            <div className="flex items-center px-4 py-3 bg-orange/5 border-b border-iras-border">
              <div className="w-3 h-3 rounded-sm bg-orange mr-3 shrink-0" />
              <span className="text-sm text-gray-700 flex-1">
                + Deferred carry-over <span className="text-gray-400 text-xs">(${deferred.toFixed(2)} ÷ 12)</span>
              </span>
              <span className="text-sm font-semibold text-orange">+${deferredMonthly.toFixed(2)}</span>
            </div>
            <div className="flex items-center px-4 py-3.5 bg-gray-50">
              <span className="text-sm font-bold text-gray-800 flex-1">Combined monthly instalment</span>
              <span className="text-xl font-bold text-navy">${nextWindowCombined.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-3">
          * $550/month base is assumed from assessable income estimate. Actual YA 2026 figures will be confirmed upon assessment.
        </p>
      </div>

      {/* Declaration */}
      <div className="bg-white border border-iras-border rounded px-6 py-4 mb-6">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={data.declared}
            onChange={(e) => {}}
            onClick={(e) => {
              const checked = e.target.checked
              data.declared = checked
            }}
            className="mt-0.5 w-4 h-4 accent-navy"
          />
          <span className="text-xs text-gray-600">
            I declare that the information provided is true and correct. I understand that providing false information is an offence under the Income Tax Act. I acknowledge that any outstanding amount deferred will be added to my next assessment window.
          </span>
        </label>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="border border-gray-300 text-gray-600 text-sm font-semibold px-6 py-2.5 rounded hover:bg-gray-50 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={onSubmit}
          className="bg-teal text-white text-sm font-semibold px-8 py-2.5 rounded hover:bg-teal-hover transition-colors"
        >
          Submit Request
        </button>
      </div>
    </div>
  )
}
