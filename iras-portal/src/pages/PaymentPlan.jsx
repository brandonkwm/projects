import { useNavigate } from 'react-router-dom'

const installments = [
  { month: 'Jan 2026', amount: 500, status: 'paid' },
  { month: 'Feb 2026', amount: 500, status: 'paid' },
  { month: 'Mar 2026', amount: 500, status: 'paid' },
  { month: 'Apr 2026', amount: 500, status: 'paid' },
  { month: 'May 2026', amount: 500, status: 'paid' },
  { month: 'Jun 2026', amount: 500, status: 'current' },
  { month: 'Jul 2026', amount: 500, status: 'upcoming' },
  { month: 'Aug 2026', amount: 500, status: 'upcoming' },
  { month: 'Sep 2026', amount: 500, status: 'upcoming' },
  { month: 'Oct 2026', amount: 500, status: 'upcoming' },
  { month: 'Nov 2026', amount: 500, status: 'upcoming' },
  { month: 'Dec 2026', amount: 500, status: 'upcoming' },
]

const paid = installments.filter(i => i.status === 'paid').length
const total = installments.length
const paidAmount = paid * 500
const remaining = (total - paid) * 500

export default function PaymentPlan() {
  const navigate = useNavigate()

  return (
    <div>
      {/* Breadcrumb */}
      <div className="text-xs text-gray-500 mb-4">
        <button onClick={() => navigate('/')} className="text-teal hover:underline">Overview</button>
        <span className="mx-1.5">/</span>
        <span className="text-gray-700">Payment Plan</span>
      </div>

      {/* Page title */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-navy">Income Tax Payment Plan</h1>
          <p className="text-sm text-gray-500 mt-0.5">Year of Assessment 2025</p>
        </div>
        <div className="flex gap-3 text-sm text-teal">
          <button className="flex items-center gap-1.5 hover:underline">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            SAVE DRAFT
          </button>
          <button className="flex items-center gap-1.5 hover:underline">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            SAVE AS PDF / PRINT
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: 'Total Tax Payable', value: '$6,000.00', sub: 'YA 2025' },
          { label: 'Amount Paid', value: `$${paidAmount.toLocaleString()}.00`, sub: `${paid} of ${total} months` },
          { label: 'Remaining Balance', value: `$${remaining.toLocaleString()}.00`, sub: `${total - paid} months left`, warn: true },
        ].map((card) => (
          <div key={card.label} className={`bg-white border rounded px-5 py-4 ${card.warn ? 'border-orange/40' : 'border-iras-border'}`}>
            <p className="text-xs text-gray-500 mb-1">{card.label}</p>
            <p className={`text-xl font-bold ${card.warn ? 'text-orange' : 'text-navy'}`}>{card.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="bg-white border border-iras-border rounded px-6 py-4 mb-5">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>Payment Progress</span>
          <span>{paid}/{total} months completed</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal rounded-full transition-all"
            style={{ width: `${(paid / total) * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-xs mt-1.5">
          <span className="text-teal font-medium">$0</span>
          <span className="text-gray-400">$6,000</span>
        </div>
      </div>

      {/* Installment table */}
      <div className="bg-white border border-iras-border rounded mb-5">
        <div className="px-6 py-3 border-b border-iras-border">
          <h2 className="text-sm font-semibold text-navy uppercase tracking-wide">GIRO Instalment Schedule</h2>
        </div>
        <div className="divide-y divide-iras-border">
          {installments.map((inst) => (
            <div key={inst.month} className="px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-700 w-20">{inst.month}</span>
                {inst.status === 'current' && (
                  <span className="text-xs bg-orange/10 text-orange border border-orange/30 px-2 py-0.5 rounded">Current</span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-800">${inst.amount.toFixed(2)}</span>
                {inst.status === 'paid' && (
                  <span className="flex items-center gap-1 text-xs text-teal">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Paid
                  </span>
                )}
                {inst.status === 'current' && (
                  <span className="text-xs text-orange">Due 10 Jun</span>
                )}
                {inst.status === 'upcoming' && (
                  <span className="text-xs text-gray-400">Upcoming</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-blue-50 border border-blue-200 rounded px-6 py-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-navy">Facing difficulty with your payments?</p>
          <p className="text-xs text-gray-600 mt-1">
            You may request to reduce your monthly instalment. Any deferred amount will be carried over to your next assessment year.
          </p>
        </div>
        <button
          onClick={() => navigate('/payment-plan/adjust')}
          className="ml-6 shrink-0 bg-navy text-white text-sm font-semibold px-5 py-2.5 rounded hover:bg-navy-dark transition-colors"
        >
          Request Adjustment
        </button>
      </div>
    </div>
  )
}
