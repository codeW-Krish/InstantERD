export type PlanTier = 'free' | 'pro' | 'team';
export type BillingCycle = 'monthly' | 'annual';
export type CurrencyCode = 'USD' | 'INR';

type PaidTier = Exclude<PlanTier, 'free'>;

export interface PlanEntitlements {
  generationsLimit: number;
  seatLimit: number;
  allowedModes: Array<'nl' | 'sql' | 'mix'>;
  allowSvgExport: boolean;
  allowPdfExport: boolean;
  allowWatermarkFreeSharing: boolean;
  allowApiAccess: boolean;
  versionHistoryDays: number;
}

export interface PaidPlanPriceConfig {
  tier: PaidTier;
  billingCycle: BillingCycle;
  currency: CurrencyCode;
  amount: number;
  displayPrice: string;
  suffix: string;
  subtitle?: string;
  badge?: string;
  stripePriceId?: string;
  uropayPlanId?: string;
}

const DEFAULT_PAID_PRICE_CONFIG: PaidPlanPriceConfig[] = [
  {
    tier: 'pro',
    billingCycle: 'monthly',
    currency: 'USD',
    amount: 9,
    displayPrice: '$9',
    suffix: 'per month',
    subtitle: 'Impulse-buy tier for solo builders',
    badge: 'Most popular',
    stripePriceId: process.env.VITE_STRIPE_PRICE_ID_PRO_MONTHLY || 'price_pro_mo',
  },
  {
    tier: 'pro',
    billingCycle: 'annual',
    currency: 'USD',
    amount: 7,
    displayPrice: '$7',
    suffix: 'per month, billed yearly',
    subtitle: '2 months free',
    badge: 'Best value',
    stripePriceId: process.env.VITE_STRIPE_PRICE_ID_PRO_ANNUAL || 'price_pro_yr',
  },
  {
    tier: 'team',
    billingCycle: 'monthly',
    currency: 'USD',
    amount: 29,
    displayPrice: '$29',
    suffix: 'per month, up to 5 seats',
    subtitle: '$5.80 per seat',
    stripePriceId: process.env.VITE_STRIPE_PRICE_ID_TEAM_MONTHLY || 'price_team_mo',
  },
  {
    tier: 'team',
    billingCycle: 'annual',
    currency: 'USD',
    amount: 24,
    displayPrice: '$24',
    suffix: 'per month, billed yearly',
    subtitle: '2 months free',
    stripePriceId: process.env.VITE_STRIPE_PRICE_ID_TEAM_ANNUAL || 'price_team_yr',
  },
  {
    tier: 'pro',
    billingCycle: 'monthly',
    currency: 'INR',
    amount: 749,
    displayPrice: '₹749',
    suffix: 'per month',
    subtitle: 'Below ₹750 decision threshold',
    badge: 'Most popular',
    uropayPlanId: process.env.VITE_UROPAY_PLAN_PRO_MONTHLY || 'uropay_pro_mo',
  },
  {
    tier: 'pro',
    billingCycle: 'annual',
    currency: 'INR',
    amount: 599,
    displayPrice: '₹599',
    suffix: 'per month, billed yearly',
    subtitle: '2 months free',
    badge: 'Best value',
    uropayPlanId: process.env.VITE_UROPAY_PLAN_PRO_ANNUAL || 'uropay_pro_yr',
  },
  {
    tier: 'team',
    billingCycle: 'monthly',
    currency: 'INR',
    amount: 2499,
    displayPrice: '₹2,499',
    suffix: 'per month, up to 5 seats',
    subtitle: '₹500 per seat',
    uropayPlanId: process.env.VITE_UROPAY_PLAN_TEAM_MONTHLY || 'uropay_team_mo',
  },
  {
    tier: 'team',
    billingCycle: 'annual',
    currency: 'INR',
    amount: 1999,
    displayPrice: '₹1,999',
    suffix: 'per month, billed yearly',
    subtitle: '2 months free',
    uropayPlanId: process.env.VITE_UROPAY_PLAN_TEAM_ANNUAL || 'uropay_team_yr',
  },
];

const ENTITLEMENTS_BY_PLAN: Record<PlanTier, PlanEntitlements> = {
  free: {
    generationsLimit: 10,
    seatLimit: 1,
    allowedModes: ['nl'],
    allowSvgExport: false,
    allowPdfExport: false,
    allowWatermarkFreeSharing: false,
    allowApiAccess: false,
    versionHistoryDays: 0,
  },
  pro: {
    generationsLimit: 100,
    seatLimit: 1,
    allowedModes: ['nl', 'sql', 'mix'],
    allowSvgExport: true,
    allowPdfExport: true,
    allowWatermarkFreeSharing: true,
    allowApiAccess: false,
    versionHistoryDays: 30,
  },
  team: {
    generationsLimit: 500,
    seatLimit: 5,
    allowedModes: ['nl', 'sql', 'mix'],
    allowSvgExport: true,
    allowPdfExport: true,
    allowWatermarkFreeSharing: true,
    allowApiAccess: true,
    versionHistoryDays: 3650,
  },
};

export const PLAN_FEATURES: Record<PlanTier, string[]> = {
  free: [
    '10 generations / month',
    'Natural language input',
    'PNG export only',
    '1 project',
  ],
  pro: [
    '100 generations / month',
    'NL + SQL + Mix input',
    'SVG + PNG + PDF export',
    'Unlimited projects',
    'Watermark-free sharing',
    '30-day version history',
  ],
  team: [
    'Everything in Pro',
    '5 seats included',
    '500 generations / month',
    'Shared workspace + projects',
    'Unlimited version history',
    'REST API access',
    'Priority support',
  ],
};

export function getPlanEntitlements(plan: PlanTier): PlanEntitlements {
  return ENTITLEMENTS_BY_PLAN[plan];
}

export function getPaidPriceConfig(): PaidPlanPriceConfig[] {
  return DEFAULT_PAID_PRICE_CONFIG;
}

export function findStripePlanByPriceId(priceId: string): PaidPlanPriceConfig | undefined {
  return DEFAULT_PAID_PRICE_CONFIG.find((entry) => entry.stripePriceId === priceId);
}

export function findUropayPlanByPlanId(planId: string): PaidPlanPriceConfig | undefined {
  return DEFAULT_PAID_PRICE_CONFIG.find((entry) => entry.uropayPlanId === planId);
}
