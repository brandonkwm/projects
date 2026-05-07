import { useState } from 'react'

const CURRENT_MONTHLY = 500
const REMAINING_MONTHS = 7
const REMAINING_BALANCE = 3000
const MIN_MONTHLY_FLOOR = 50

const reasons = [
  { value: '', label: 'Please select a reason' },
  { value: 'retrenchment', label: 'Retrenchment / Lay-off' },
  { value: 'reduced_income', label: 'Significant reduction in income' },
  { value: 'medical', label: 'Medical emergency / hospitalisation' },
  { value: 'debt', label: 'Severe financial debt' },
  { value: 'other', label: 'Other reasons' },
]

function getErrors(data) {
  const e = {}
  const amt = Number(data.newMonthlyAmount)
  if (!data.newMonthlyAmount || isNaN(amt)) {
    e.amount = 'Please enter a valid amount.'
  } else if (amt <= 0) {
    e.amount = 'Amount must be greater than $0.'
  } else if (amt >= CURRENT_MONTHLY) {
    e.amount = `New amount must be less than your current instalment of $${CURRENT_MONTHLY}.`
  } else if (amt < MIN_MONTHLY_FLOOR) {
    e.amount = `Minimum allowable instalment is $${MIN_MONTHLY_FLOOR}/month.`
  }
  if (!data.reason) e.reason = 'Please select a reason.'
  return e
}

export default function Step1Input({ data, onUpdate, onNext }) {
  const [touched, setTouched] = useState({})

  const allErrors = getErrors(data)
  const visibleErrors = Object.fromEntries(
    Object.entries(allErrors).filter(([key]) => touched[key])
  )

  const touch = (field) => setTouched((t) => ({ ...t, [field]: true }))

  const handleNext = () => {
    setTouched({ amount: true, reason: true, upload: true })
    if (Object.keys(getErrors(data)).length === 0) onNext()
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      onUpdate({ uploadedFile: file })
      touch('upload')
    }
  }

  const newMonthly = Number(data.newMonthlyAmount)
  const isValidAmount = newMonthly >= MIN_MONTHLY_FLOOR && newMonthly < CURRENT_MONTHLY
  const deferred = isValidAmount ? Math.max(0, REMAINING_BALANCE - newMonthly * REMAINING_MONTHS) : null

  return (
    <div className="max-w-2xl mx-auto">
      {/* Current plan summary */}
      <div className="bg-blue-50 border border-blue-200 rounded px-5 py-4 mb-5">
        <h3 className="text-sm font-semibold text-navy mb-3">Your Current Payment Plan — YA 2025</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { label: 'Remaining Balance', value: `$${REMAINING_BALANCE.toLocaleString()}` },
            { label: 'Current Monthly', value: `$${CURRENT_MONTHLY}` },
            { label: 'Months Remaining', value: `${REMAINING_MONTHS}` },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded p-3 border border-blue-100">
              <p className="text-xs text-gray-500">{item.label}</p>
              <p className="text-lg font-bold text-navy mt-1">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Guardrails — simplified to 4 */}
      <div className="bg-white border border-iras-border rounded px-5 py-3 mb-5 flex items-start gap-3">
        <svg className="w-4 h-4 text-navy mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <div className="text-xs text-gray-600 space-y-1">
          <p className="font-semibold text-gray-700">Before you proceed:</p>
          <p>· Minimum instalment is <strong>10% of your current monthly — $50</strong></p>
          <p>· Supporting document is <strong>optional</strong> — but speeds up processing significantly</p>
          <p>· If you have an existing deferred balance, further deferral this window is capped at <strong>50% of that amount</strong></p>
          <p>· You cannot submit a new request while a prior one is <strong>pending review</strong></p>
        </div>
      </div>

      {/* New amount */}
      <div className="bg-white border border-iras-border rounded px-6 py-5 mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          New Monthly Instalment Amount (SGD) <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Enter the amount you can pay per month. Must be between <strong>${MIN_MONTHLY_FLOOR}</strong> and <strong>${CURRENT_MONTHLY - 1}</strong>.
        </p>
        <div className="relative max-w-xs">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
          <input
            type="number"
            min={MIN_MONTHLY_FLOOR}
            max={CURRENT_MONTHLY - 1}
            value={data.newMonthlyAmount}
            onChange={(e) => { onUpdate({ newMonthlyAmount: e.target.value }); touch('amount') }}
            onBlur={() => touch('amount')}
            placeholder="e.g. 200"
            className={`w-full border rounded pl-7 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent ${
              visibleErrors.amount ? 'border-red-400 bg-red-50' : 'border-iras-border'
            }`}
          />
        </div>
        {visibleErrors.amount && (
          <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
            <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            {visibleErrors.amount}
          </p>
        )}

        {deferred !== null && !allErrors.amount && (
          <div className="mt-3 bg-teal/5 border border-teal/20 rounded px-4 py-2.5 text-xs text-gray-600 space-y-0.5">
            <p>${newMonthly}/mo × {REMAINING_MONTHS} months = <strong>${(newMonthly * REMAINING_MONTHS).toFixed(2)}</strong> paid this window.</p>
            <p><span className="font-semibold text-orange">${deferred.toFixed(2)}</span> will be deferred to YA 2026.</p>
          </div>
        )}
      </div>

      {/* Reason */}
      <div className="bg-white border border-iras-border rounded px-6 py-5 mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Reason for Adjustment <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-500 mb-3">Select the reason that best describes your situation.</p>
        <select
          value={data.reason}
          onChange={(e) => { onUpdate({ reason: e.target.value }); touch('reason') }}
          onBlur={() => touch('reason')}
          className={`w-full border rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent bg-white ${
            visibleErrors.reason ? 'border-red-400 bg-red-50' : 'border-iras-border'
          }`}
        >
          {reasons.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        {visibleErrors.reason && (
          <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
            <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            {visibleErrors.reason}
          </p>
        )}
      </div>

      {/* Document upload — always required */}
      <div className="bg-white border border-iras-border rounded px-6 py-5 mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Supporting Document <span className="text-gray-400 font-normal">(Optional)</span>
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Upload proof of your circumstance — e.g. retrenchment letter, hospital bill, debt statement. Accepted: PDF, JPG, PNG (max 5MB).
        </p>

        <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors group ${
          visibleErrors.upload ? 'border-red-400 bg-red-50' : 'border-iras-border hover:border-navy hover:bg-blue-50/30'
        }`}>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} className="hidden" />
          {data.uploadedFile ? (
            <div className="flex items-center gap-3 text-teal">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-left">
                <p className="text-sm font-semibold">{data.uploadedFile.name}</p>
                <p className="text-xs text-gray-500">{(data.uploadedFile.size / 1024).toFixed(0)} KB — click to change</p>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <svg className="w-10 h-10 text-gray-300 mx-auto mb-2 group-hover:text-navy transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm text-gray-500">Drag & drop or <span className="text-teal font-medium">browse file</span></p>
              <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG up to 5MB</p>
            </div>
          )}
        </label>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className={`rounded px-3 py-2 border flex items-start gap-2 ${data.uploadedFile ? 'bg-teal/5 border-teal/30' : 'bg-gray-50 border-iras-border'}`}>
            <svg className="w-3.5 h-3.5 mt-0.5 text-teal shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            <div>
              <p className="font-semibold text-gray-700">With document</p>
              <p className="text-gray-500">1–3 working days</p>
            </div>
          </div>
          <div className={`rounded px-3 py-2 border flex items-start gap-2 ${!data.uploadedFile ? 'bg-orange/5 border-orange/30' : 'bg-gray-50 border-iras-border'}`}>
            <svg className="w-3.5 h-3.5 mt-0.5 text-orange shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
            <div>
              <p className="font-semibold text-gray-700">Without document</p>
              <p className="text-gray-500">Up to 10 working days; IRAS may request one</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleNext}
          className="bg-navy text-white text-sm font-semibold px-8 py-2.5 rounded hover:bg-navy-dark transition-colors"
        >
          Next: Review Changes →
        </button>
      </div>
    </div>
  )
}
