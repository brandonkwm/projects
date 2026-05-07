import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StepIndicator from '../components/StepIndicator'
import Step1Input from './steps/Step1Input'
import Step2Review from './steps/Step2Review'
import Step3Confirm from './steps/Step3Confirm'

const initialData = {
  newMonthlyAmount: '',
  reason: '',
  uploadedFile: null,
  declared: false,
}

export default function AdjustmentWizard() {
  const [step, setStep] = useState(1)
  const [data, setData] = useState(initialData)
  const navigate = useNavigate()

  const update = (patch) => setData((d) => ({ ...d, ...patch }))

  return (
    <div>
      {/* Breadcrumb */}
      <div className="text-xs text-gray-500 mb-4">
        <button onClick={() => navigate('/')} className="text-teal hover:underline">Overview</button>
        <span className="mx-1.5">/</span>
        <button onClick={() => navigate('/payment-plan')} className="text-teal hover:underline">Payment Plan</button>
        <span className="mx-1.5">/</span>
        <span className="text-gray-700">Request Adjustment</span>
      </div>

      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-navy">Request Payment Plan Adjustment</h1>
          <p className="text-sm text-gray-500 mt-0.5">Year of Assessment 2025 — GIRO Instalments</p>
        </div>
        {step < 3 && (
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
        )}
      </div>

      {/* Step indicator */}
      <StepIndicator currentStep={step} />

      {/* Step content */}
      {step === 1 && (
        <Step1Input
          data={data}
          onUpdate={update}
          onNext={() => setStep(2)}
        />
      )}
      {step === 2 && (
        <Step2Review
          data={data}
          onBack={() => setStep(1)}
          onSubmit={() => setStep(3)}
        />
      )}
      {step === 3 && (
        <Step3Confirm data={data} />
      )}
    </div>
  )
}
