import { useNavigate } from 'react-router-dom'

const mockUser = { name: 'John Tan', nric: 'S****567A' }

const quickLinks = [
  { icon: '📄', label: 'File Income Tax Return', desc: 'YA 2025 filing open until 18 Apr' },
  { icon: '✏️', label: 'Amend Tax Bill', desc: 'Update income or relief claims' },
  { icon: '💳', label: 'Payment Plan', desc: 'View or adjust your GIRO plan', path: '/payment-plan' },
  { icon: '📬', label: 'Notices & Letters', desc: '1 unread notice' },
]

export default function Overview() {
  const navigate = useNavigate()

  return (
    <div>
      {/* Tax Summary Card */}
      <div className="bg-white border border-iras-border rounded mb-5">
        <div className="px-6 py-3 border-b border-iras-border">
          <h2 className="text-sm font-semibold text-navy uppercase tracking-wide">Tax Summary — YA 2025</h2>
        </div>
        <div className="grid grid-cols-4 divide-x divide-iras-border">
          {[
            { label: 'Assessable Income', value: '$62,400' },
            { label: 'Total Deductions', value: '$4,500' },
            { label: 'Chargeable Income', value: '$57,900' },
            { label: 'Tax Payable', value: '$6,000', highlight: true },
          ].map((item) => (
            <div key={item.label} className="px-6 py-4 text-center">
              <p className="text-xs text-gray-500 mb-1">{item.label}</p>
              <p className={`text-lg font-semibold ${item.highlight ? 'text-navy' : 'text-gray-800'}`}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-4">
        {quickLinks.map((link) => (
          <button
            key={link.label}
            onClick={() => link.path && navigate(link.path)}
            className={`bg-white border border-iras-border rounded px-5 py-4 text-left flex items-start gap-4 transition-all ${
              link.path ? 'hover:border-navy hover:shadow-sm cursor-pointer' : 'cursor-default'
            }`}
          >
            <span className="text-2xl">{link.icon}</span>
            <div>
              <p className={`text-sm font-semibold ${link.path ? 'text-navy' : 'text-gray-700'}`}>
                {link.label}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{link.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Notice banner */}
      <div className="mt-5 bg-orange/10 border border-orange/30 rounded px-5 py-3 flex items-start gap-3">
        <svg className="w-4 h-4 text-orange mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <div>
          <p className="text-sm font-semibold text-orange">Payment Due Reminder</p>
          <p className="text-xs text-gray-600 mt-0.5">Your next GIRO deduction of <strong>$500</strong> is scheduled for <strong>10 Jun 2026</strong>. If you are facing difficulty, you may request a payment plan adjustment.</p>
        </div>
      </div>
    </div>
  )
}
