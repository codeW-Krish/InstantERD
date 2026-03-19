import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { Loader2, Check, X } from 'lucide-react';
import { TextureCardStyled, TextureCardContent } from '../components/TextureCard';
import { Button } from '../components/Button';
import { account } from '../lib/appwrite/client';

type CurrencyCode = 'USD' | 'INR';
type BillingCycle = 'monthly' | 'annual';
type PaidTier = 'pro' | 'team';

interface PaidPlanConfig {
  tier: PaidTier;
  billingCycle: BillingCycle;
  currency: CurrencyCode;
  displayPrice: string;
  suffix: string;
  subtitle?: string;
  badge?: string;
  stripePriceId?: string;
  uropayPlanId?: string;
}

interface PricingConfigResponse {
  annualLabel: string;
  freePlan: {
    displayPriceByCurrency: Record<CurrencyCode, string>;
    suffix: string;
    features: string[];
    lockedBadges: string[];
  };
  paid: PaidPlanConfig[];
  planFeatures: Record<'free' | 'pro' | 'team', string[]>;
}

export default function Pricing() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [pricingConfig, setPricingConfig] = useState<PricingConfigResponse | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('pricing-currency') as CurrencyCode | null;
    if (saved === 'USD' || saved === 'INR') {
      setCurrency(saved);
      return;
    }

    // Detect Indian localization on first visit only.
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone === 'Asia/Kolkata' || timezone === 'Asia/Calcutta') {
      setCurrency('INR');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('pricing-currency', currency);
  }, [currency]);

  useEffect(() => {
    async function loadPricing() {
      try {
        const res = await fetch('http://localhost:3001/api/pricing/config');
        if (!res.ok) throw new Error('Failed to load pricing config');
        const data = await res.json();
        setPricingConfig(data);
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to load pricing config');
      }
    }
    loadPricing();
  }, []);

  useEffect(() => {
    async function loadEntitlements() {
      if (!user) {
        setWorkspaceId(null);
        return;
      }
      try {
        const jwt = await account.createJWT();
        const res = await fetch('http://localhost:3001/api/entitlements', {
          headers: { Authorization: `Bearer ${jwt.jwt}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setWorkspaceId(data.workspaceId);
      } catch (err) {
        console.error('Failed to load workspace entitlements:', err);
      }
    }
    loadEntitlements();
  }, [user]);

  const getPaidPlan = (tier: PaidTier): PaidPlanConfig | undefined => {
    if (!pricingConfig) return undefined;
    return pricingConfig.paid.find(
      (entry) => entry.tier === tier && entry.currency === currency && entry.billingCycle === billingCycle,
    );
  };

  const handleUpgrade = async (tier: 'pro' | 'team') => {
    if (!user) {
      navigate('/login?redirect=/pricing');
      return;
    }
    if (!workspaceId) {
      setErrorMessage('Could not find your workspace. Please refresh and try again.');
      return;
    }

    const selected = getPaidPlan(tier);
    if (!selected) {
      setErrorMessage('Selected pricing option is not available.');
      return;
    }

    setLoadingPlan(tier);
    setErrorMessage(null);

    try {
      const isINR = currency === 'INR';
      const endpoint = isINR ? '/api/uropay/checkout' : '/api/stripe/checkout';
      
      const payload = isINR 
        ? { planId: selected.uropayPlanId, workspaceId, userEmail: user.email }
        : { priceId: selected.stripePriceId, workspaceId, userEmail: user.email };

      if ((isINR && !selected.uropayPlanId) || (!isINR && !selected.stripePriceId)) {
        throw new Error('Payment identifier not configured for selected plan.');
      }

      const res = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to create checkout session");
      }
    } catch (e: any) {
      console.error(e);
      setErrorMessage(e.message);
    } finally {
      setLoadingPlan(null);
    }
  };

  const proPlan = getPaidPlan('pro');
  const teamPlan = getPaidPlan('team');

  return (
    <div className="min-h-screen bg-blueprint grid-bg pt-24 px-6 pb-24 font-serif text-paper">
      <div className="max-w-5xl mx-auto space-y-16">
        <div className="text-center space-y-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl text-emerald-accent">Simple, transparent pricing</h1>
          <p className="text-xl text-paper/60 font-mono">Unlock unlimited AI generation and team collaboration.</p>
          
          <div className="flex items-center justify-center gap-4 mt-8 flex-wrap">
            <div className="inline-flex items-center p-1 border border-paper/20 rounded-xl bg-paper/5" role="tablist" aria-label="Currency">
              {(['USD', 'INR'] as const).map((option) => (
                <button
                  key={option}
                  role="tab"
                  aria-selected={currency === option}
                  onClick={() => setCurrency(option)}
                  className={`px-5 py-2 rounded-lg font-mono text-xs uppercase tracking-widest transition-colors ${currency === option ? 'bg-emerald-accent text-blueprint' : 'text-paper/50 hover:text-paper'}`}
                >
                  {option === 'USD' ? 'USD $' : 'INR ₹'}
                </button>
              ))}
            </div>

            <div className="inline-flex items-center p-1 border border-paper/20 rounded-xl bg-paper/5" role="tablist" aria-label="Billing cycle">
              <button
                role="tab"
                aria-selected={billingCycle === 'monthly'}
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 py-2 rounded-lg font-mono text-xs uppercase tracking-widest transition-colors ${billingCycle === 'monthly' ? 'bg-emerald-accent text-blueprint' : 'text-paper/50 hover:text-paper'}`}
              >
                Monthly
              </button>
              <button
                role="tab"
                aria-selected={billingCycle === 'annual'}
                onClick={() => setBillingCycle('annual')}
                className={`px-5 py-2 rounded-lg font-mono text-xs uppercase tracking-widest transition-colors ${billingCycle === 'annual' ? 'bg-emerald-accent text-blueprint' : 'text-paper/50 hover:text-paper'}`}
              >
                Annual
              </button>
            </div>

            {billingCycle === 'annual' && (
              <span className="font-mono text-[11px] uppercase tracking-widest text-emerald-accent/90">
                {pricingConfig?.annualLabel || '2 months free'}
              </span>
            )}
          </div>

          <div className="flex items-center justify-center gap-4 mt-2 text-xs font-mono text-paper/40">
            {currency === 'INR' ? <span>Powered by UROPay</span> : <span>Powered by Stripe</span>}
          </div>

          {errorMessage && (
            <div className="max-w-xl mx-auto border border-red-500/30 bg-red-500/10 p-3 rounded-lg">
              <p className="font-mono text-xs text-red-300 uppercase tracking-widest">{errorMessage}</p>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Free Tier */}
          <TextureCardStyled className="border-paper/10 opacity-70">
            <TextureCardContent className="p-8 space-y-6">
              <div>
                <h3 className="font-mono text-xl uppercase tracking-widest text-paper/60">Free</h3>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-4xl font-bold">{pricingConfig?.freePlan.displayPriceByCurrency?.[currency] || (currency === 'INR' ? '₹0' : '$0')}</span>
                  <span className="font-mono text-sm text-paper/40">/ {pricingConfig?.freePlan.suffix || 'forever'}</span>
                </div>
              </div>
              <ul className="space-y-4 font-mono text-sm text-paper/60">
                {(pricingConfig?.freePlan.features || []).map((feature) => (
                  <li key={feature} className="flex gap-3 items-center"><Check size={16} /> {feature}</li>
                ))}
                {(pricingConfig?.freePlan.lockedBadges || []).map((feature) => (
                  <li key={feature} className="flex gap-3 items-center text-paper/30">
                    <X size={16} /> {feature}
                  </li>
                ))}
              </ul>
              <div className="pt-6">
                <Button disabled className="w-full bg-paper/5 text-paper/40 border-paper/10 h-12">Your Current Plan</Button>
              </div>
            </TextureCardContent>
          </TextureCardStyled>

          {/* Pro Tier (Highlighted) */}
          <TextureCardStyled className="border-emerald-accent/50 shadow-[0_0_30px_rgba(16,185,129,0.15)] relative scale-105 z-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-accent text-blueprint font-mono text-[10px] uppercase font-bold tracking-widest px-4 py-1 rounded-full">
              {proPlan?.badge || 'Most Popular'}
            </div>
            <TextureCardContent className="p-8 space-y-6">
              <div>
                <h3 className="font-mono text-xl uppercase tracking-widest text-emerald-accent">Pro</h3>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-emerald-accent">{proPlan?.displayPrice || '-'}</span>
                  <span className="font-mono text-sm text-emerald-accent/60">{proPlan?.suffix || ''}</span>
                </div>
                {proPlan?.subtitle && (
                  <p className="font-mono text-[11px] uppercase tracking-widest text-emerald-accent/70 mt-2">{proPlan.subtitle}</p>
                )}
              </div>
              <ul className="space-y-4 font-mono text-sm text-paper/90">
                {(pricingConfig?.planFeatures.pro || []).map((feature) => (
                  <li key={feature} className="flex gap-3 items-center"><Check size={16} className="text-emerald-accent/50" /> {feature}</li>
                ))}
              </ul>
              <div className="pt-6">
                <Button 
                  onClick={() => handleUpgrade('pro')}
                  disabled={!pricingConfig || !proPlan || !!loadingPlan}
                  className="w-full h-12 bg-emerald-accent text-blueprint"
                >
                  {loadingPlan === 'pro' ? <Loader2 className="animate-spin mx-auto" /> : "Upgrade to Pro"}
                </Button>
              </div>
            </TextureCardContent>
          </TextureCardStyled>

          {/* Team Tier */}
          <TextureCardStyled className="border-paper/20">
            <TextureCardContent className="p-8 space-y-6">
              <div>
                <h3 className="font-mono text-xl uppercase tracking-widest text-blue-400">Team</h3>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-blue-400">{teamPlan?.displayPrice || '-'}</span>
                  <span className="font-mono text-sm text-paper/40">{teamPlan?.suffix || ''}</span>
                </div>
                {teamPlan?.subtitle && (
                  <p className="font-mono text-[11px] uppercase tracking-widest text-blue-300/80 mt-2">{teamPlan.subtitle}</p>
                )}
              </div>
              <ul className="space-y-4 font-mono text-sm text-paper/80">
                {(pricingConfig?.planFeatures.team || []).map((feature) => (
                  <li key={feature} className="flex gap-3 items-center"><Check size={16} className="text-blue-400/50" /> {feature}</li>
                ))}
              </ul>
              <div className="pt-6">
                <Button 
                  onClick={() => handleUpgrade('team')}
                  disabled={!pricingConfig || !teamPlan || !!loadingPlan}
                  className="w-full h-12 bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20"
                >
                  {loadingPlan === 'team' ? <Loader2 className="animate-spin mx-auto" /> : "Upgrade to Team"}
                </Button>
              </div>
            </TextureCardContent>
          </TextureCardStyled>
        </div>
      </div>
    </div>
  );
}
