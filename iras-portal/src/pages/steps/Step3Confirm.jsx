import { useNavigate } from 'react-router-dom'

const reasonLabels = {
  retrenchment: 'Retrenchment / Lay-off',
  reduced_income: 'Significant reduction in income',
  medical: 'Medical emergency / hospitalisation',
  debt: 'Severe financial debt',
  other: 'Other reasons',
}

function generateRef() {
  return 'PPA-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-2026'
}

const refNumber = generateRef()

export default function Step3Confirm({ data }) {
  const navigate = useNavigate()
  const newMonthly = Number(data.newMonthlyAmount)
  const deferred = 3000 - newMonthly * 7

  return (
    <div className="max-w-xl mx-auto text-center">
      {/* Success icon */}
      <div className="flex justify-center mb-5">
        <div className="w-16 h-16 bg-teal/10 rounded-full flex items-center justify-center">
          <svg className="w-9 h-9 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>

      <h2 className="text-xl font-bold text-navy mb-1">Request Submitted Successfully</h2>
      <p className="text-sm text-gray-500 mb-6">
        Your payment plan adjustment request has been received by IRAS.
      </p>

      {/* Reference number */}
      <div className="bg-navy/5 border border-navy/20 rounded-lg px-6 py-4 mb-6 text-left">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-500">Reference Number</p>
            <p className="text-lg font-bold text-navy tracking-wider mt-0.5">{refNumber}</p>
          </div>
          <button
            onClick={() => navigator.clipboard?.writeText(refNumber)}
            className="text-xs text-teal hover:underline flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">Submitted: {new Date().toLocaleDateString('en-SG', { day: '2-digit', month: 'short', year: 'numeric' })} — keep this for your records</p>
      </div>

      {/* Summary */}
      <div className="bg-white border border-iras-border rounded-lg px-5 py-4 mb-6 text-left text-sm">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Request Summary</h3>
        {[
          { label: 'New monthly instalment', value: `$${newMonthly.toFixed(2)}` },
          { label: 'Effective from', value: 'Jun 2026' },
          { label: 'Deferred to YA 2026', value: `$${deferred.toFixed(2)}`, highlight: true },
          { label: 'Reason', value: reasonLabels[data.reason] || data.reason },
          { label: 'Supporting document', value: data.uploadedFile ? data.uploadedFile.name : 'None' },
        ].map((row) => (
          <div key={row.label} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
            <span className="text-gray-500">{row.label}</span>
            <span className={`font-medium ${row.highlight ? 'text-orange' : 'text-gray-800'}`}>{row.value}</span>
          </div>
        ))}
      </div>

      {/* What happens next */}
      <div className="bg-white border border-iras-border rounded-lg px-5 py-4 mb-6 text-left">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">What Happens Next</h3>
        <div className="space-y-3">
          {[
            {
              icon: '🔍',
              title: 'Review (1–3 working days)',
              desc: data.uploadedFile
                ? 'IRAS will review your request and supporting document.'
                : 'IRAS will review your request. Providing a supporting document can speed up approval.',
            },
            {
              icon: '📬',
              title: 'Notification via Inbox',
              desc: 'You will receive an official letter in your myTax Portal inbox once the request is processed.',
            },
            {
              icon: '💳',
              title: 'Updated GIRO Plan',
              desc: `If approved, your GIRO deduction will change to $${newMonthly.toFixed(2)}/month from Jun 2026. The deferred $${deferred.toFixed(2)} will be spread across YA 2026 instalments.`,
            },
          ].map((item) => (
            <div key={item.title} className="flex gap-3">
              <span className="text-lg shrink-0">{item.icon}</span>
              <div>
                <p className="text-sm font-semibold text-gray-700">{item.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => window.print()}
          className="flex-1 border border-iras-border text-gray-600 text-sm font-semibold py-2.5 rounded hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Save as PDF
        </button>
        <button
          onClick={() => navigate('/')}
          className="flex-1 bg-navy text-white text-sm font-semibold py-2.5 rounded hover:bg-navy-dark transition-colors"
        >
          Back to Overview
        </button>
      </div>
    </div>
  )
}
