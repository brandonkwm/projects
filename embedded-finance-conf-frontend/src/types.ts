export type CategoryId = 'payments' | 'lending' | 'investment' | 'insurance'
export type KycLevel = 'none' | 'light' | 'full'

export interface Scheme {
  id: string
  label: string
  geo: string
}

export interface SubCategory {
  id: string
  label: string
  description?: string
  schemes?: Scheme[]
}

export interface Category {
  id: CategoryId
  label: string
  description: string
  subCategories: SubCategory[]
}

export interface Geo {
  id: string
  label: string
}

export interface FundingOption {
  id: string
  label: string
}

export interface KycOption {
  id: KycLevel
  label: string
  description: string
}

export interface PricingRules {
  baseSetup: number
  baseMonthly: number
  perGeoSetup: number
  perGeoMonthly: number
  perSchemeSetup: number
  perSchemeMonthly: number
  kycMultiplierNone: number
  kycMultiplierLight: number
  kycMultiplierFull: number
}

export interface Config {
  categories: Category[]
  geos: Geo[]
  funding: FundingOption[]
  kycLevels: KycOption[]
  pricing: PricingRules
}

export const DEFAULT_PRICING: PricingRules = {
  baseSetup: 5000,
  baseMonthly: 1000,
  perGeoSetup: 1500,
  perGeoMonthly: 300,
  perSchemeSetup: 800,
  perSchemeMonthly: 200,
  kycMultiplierNone: 1.0,
  kycMultiplierLight: 1.2,
  kycMultiplierFull: 1.4,
}

export const DEFAULT_CONFIG: Config = {
  categories: [
    {
      id: 'payments',
      label: 'Embedded Payments',
      description: 'Accept and route payments via cards, bank linkages, and rails.',
      subCategories: [
        { id: 'credit_card', label: 'Credit card payments', description: 'Card acquiring and processing.' },
        {
          id: 'bank_linkage',
          label: 'Bank account linkages',
          description: 'Direct bank debits/credits via local schemes.',
          schemes: [
            { id: 'EDDA', label: 'EDDA', geo: 'SG' },
            { id: 'NPP', label: 'NPP', geo: 'AU' },
            { id: 'FPS', label: 'FPS', geo: 'UK' },
            { id: 'SEPA', label: 'SEPA', geo: 'EU' },
            { id: 'ACH', label: 'ACH', geo: 'US' },
          ],
        },
      ],
    },
    {
      id: 'lending',
      label: 'Embedded Lending & Credit',
      description: 'Embed credit, BNPL, and working capital into your product.',
      subCategories: [
        { id: 'bnpl', label: 'Buy now pay later', description: 'Split payments and short-term instalments.' },
        { id: 'working_capital', label: 'Working capital', description: 'Lines of credit and supplier financing.' },
        { id: 'consumer_loans', label: 'Consumer loans', description: 'Personal and point-of-sale lending.' },
      ],
    },
    {
      id: 'investment',
      label: 'Embedded Investment',
      description: 'Offer brokerage, savings, or wealth products within your app.',
      subCategories: [
        { id: 'brokerage', label: 'Brokerage', description: 'Trading and custody.' },
        { id: 'savings', label: 'Savings / deposits', description: 'Interest-bearing accounts and deposits.' },
      ],
    },
    {
      id: 'insurance',
      label: 'Embedded Insurance',
      description: 'Embed coverage and parametric products at point of need.',
      subCategories: [
        { id: 'embedded_coverage', label: 'Embedded coverage', description: 'Policies sold alongside your product.' },
        { id: 'parametric', label: 'Parametric', description: 'Trigger-based payouts (e.g. weather, delay).' },
      ],
    },
  ],
  geos: [
    { id: 'US', label: 'US' },
    { id: 'EU', label: 'EU' },
    { id: 'UK', label: 'UK' },
    { id: 'SG', label: 'SG' },
    { id: 'AU', label: 'AU' },
  ],
  funding: [
    { id: 'ach', label: 'ACH' },
    { id: 'sepa', label: 'SEPA' },
    { id: 'stablecoin', label: 'Stablecoins' },
  ],
  kycLevels: [
    { id: 'none', label: 'No KYC', description: 'Pseudo-anonymous usage for very low risk, low limits.' },
    { id: 'light', label: 'Light KYC', description: 'Name + address, suitable for low/medium risk use cases.' },
    { id: 'full', label: 'Full KYC', description: 'Document verification, higher limits and risk coverage.' },
  ],
  pricing: DEFAULT_PRICING,
}
