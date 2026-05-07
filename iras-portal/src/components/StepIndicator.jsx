export default function StepIndicator({ currentStep }) {
  const steps = [
    { num: 1, label: 'Review & Update' },
    { num: 2, label: 'Review Changes' },
    { num: 3, label: 'Acknowledgement' },
  ]

  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, i) => (
        <div key={step.num} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                currentStep === step.num
                  ? 'bg-navy text-white'
                  : currentStep > step.num
                  ? 'bg-teal text-white'
                  : 'bg-gray-300 text-gray-500'
              }`}
            >
              {currentStep > step.num ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                step.num
              )}
            </div>
            <span
              className={`text-xs mt-1 whitespace-nowrap ${
                currentStep === step.num ? 'text-navy font-semibold' : 'text-gray-400'
              }`}
            >
              {step.num} {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`w-24 h-0.5 mx-2 mb-4 ${
                currentStep > step.num ? 'bg-teal' : 'bg-gray-300'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}
