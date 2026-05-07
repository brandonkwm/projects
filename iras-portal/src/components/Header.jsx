import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const IrasLogo = () => (
  <div className="flex items-center gap-3">
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="26" cy="26" r="26" fill="#E8E8E8" />
      <circle cx="26" cy="26" r="20" fill="#B0B8C4" />
      <path d="M14 26 Q20 18 26 26 Q32 34 38 26" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M14 32 Q20 24 26 32 Q32 40 38 32" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M18 20 L34 20 L30 14 Z" fill="#6B7A8D" />
    </svg>
    <div className="leading-tight">
      <div className="text-xs font-semibold text-gray-700 tracking-wide">INLAND REVENUE</div>
      <div className="text-xs font-semibold text-gray-700 tracking-wide">AUTHORITY</div>
      <div className="text-xs font-semibold text-gray-700 tracking-wide">OF SINGAPORE</div>
    </div>
  </div>
)

const individualsMenu = [
  { label: 'File Income Tax Return', path: null },
  { label: 'Amend Tax Bill', path: null },
  { label: "Check Your Employer's Employment Income Submission Status", path: null },
  { label: 'Apply for Extension of Time to File', path: null },
  { label: 'View/ Transfer Parenthood Tax Rebate (PTR)', path: null },
  { label: 'Update Duplicate Relief Claim', path: null },
  { label: 'View/ Adjust Tax Payment Plan', path: '/payment-plan', highlight: true },
]

export default function Header() {
  const [individualsOpen, setIndividualsOpen] = useState(false)
  const navigate = useNavigate()

  const handleNavItem = (path) => {
    if (path) {
      navigate(path)
      setIndividualsOpen(false)
    }
  }

  return (
    <header className="w-full">
      {/* Top utility bar */}
      <div className="bg-navy flex items-center justify-between px-6 py-2">
        <IrasLogo />
        <div className="flex items-center gap-4">
          <button className="bg-teal text-white text-sm font-semibold px-5 py-1.5 rounded hover:bg-teal-hover transition-colors">
            LOGOUT
          </button>
          <button className="text-white hover:text-gray-300 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* User context bar */}
      <div className="bg-navy border-t border-blue-800 flex items-center justify-between px-6 py-1.5">
        <div className="text-white text-sm font-semibold tracking-wide">
          TAN, JOHN
          <span className="ml-3 text-xs font-normal text-blue-300">S****567A</span>
        </div>
        <div className="flex items-center gap-6">
        <button className="text-white text-sm flex items-center gap-1.5 hover:text-gray-300 transition-colors">
          <span>Inbox/ Notices</span>
          <span className="w-2.5 h-2.5 bg-red-500 rounded-full inline-block"></span>
        </button>
        <button className="text-white text-sm hover:text-gray-300 transition-colors">Account/ Payment</button>
        <button className="text-white text-sm flex items-center gap-1.5 hover:text-gray-300 transition-colors">
          <svg className="w-6 h-6 rounded-full bg-gray-400 p-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>Profile</span>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        </div>
      </div>

      {/* Main nav */}
      <div className="bg-navy-dark relative">
        <nav className="flex px-6">
          <button
            onClick={() => navigate('/')}
            className="text-white text-sm px-4 py-3 hover:bg-blue-800 transition-colors"
          >
            Overview
          </button>

          <div className="relative">
            <button
              onClick={() => setIndividualsOpen(!individualsOpen)}
              onBlur={() => setTimeout(() => setIndividualsOpen(false), 150)}
              className="text-white text-sm px-4 py-3 hover:bg-blue-800 transition-colors flex items-center gap-1 border-b-2 border-orange"
            >
              Individuals
              <svg className="w-3.5 h-3.5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {individualsOpen && (
              <div className="absolute top-full left-0 bg-white border-l-4 border-orange shadow-lg z-50 min-w-[320px]">
                {individualsMenu.map((item) => (
                  <button
                    key={item.label}
                    onMouseDown={() => handleNavItem(item.path)}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors block border-b border-gray-100 last:border-0 ${
                      item.highlight ? 'text-teal font-semibold' : 'text-gray-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {['Property Tax', 'S45', 'More Services'].map((item) => (
            <button
              key={item}
              className="text-white text-sm px-4 py-3 hover:bg-blue-800 transition-colors"
            >
              {item}
            </button>
          ))}
        </nav>
      </div>
    </header>
  )
}
