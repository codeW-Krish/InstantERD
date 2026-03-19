import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, Info } from "lucide-react";
import { Button } from "./Button";

export type PlanId = string;

export interface Feature {
  text: string;
  hasInfo?: boolean;
}

export interface Plan {
  id: PlanId;
  name: string;
  description: string;
  priceMonthly: string;
  priceYearly: string;
  badge?: string;
  featuresLabel?: string;
  features: Feature[];
}

export interface PricingSectionProps {
  title?: string;
  plans: Plan[];
  defaultPlanId?: PlanId;
  defaultBillingCycle?: "monthly" | "yearly";
  monthlyLabel?: string;
  yearlyLabel?: string;
  footerText?: string;
  buttonText?: string;
  buttonHoverText?: string;
  onContinue?: (planId: PlanId, billingCycle: "monthly" | "yearly") => void;
}

export default function PricingSection({
  title = "Select your blueprint",
  plans,
  defaultPlanId,
  defaultBillingCycle = "monthly",
  monthlyLabel = "Monthly",
  yearlyLabel = "Yearly",
  footerText = "Cancel anytime. No long-term contract.",
  buttonText = "Continue",
  buttonHoverText = "Let's Go",
  onContinue,
}: PricingSectionProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>(
    defaultPlanId || (plans.length > 0 ? plans[0].id : ""),
  );
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    defaultBillingCycle,
  );

  return (
    <div className="flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-[460px] bg-blueprint dark:bg-paper rounded-[24px] p-1.5 shadow-sm ring-1 ring-paper/5 dark:ring-blueprint/5">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-4">
          <h2 className="text-[17px] font-serif font-medium text-paper dark:text-blueprint tracking-tight">
            {title}
          </h2>
          <div className="flex items-center bg-paper/5 dark:bg-blueprint/5 p-1 rounded-full relative z-0 ring-1 ring-transparent dark:ring-blueprint/10">
            <motion.div
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-blueprint dark:bg-emerald-accent/15 rounded-full shadow-sm dark:shadow-none -z-10"
              animate={{
                x: billingCycle === "monthly" ? 0 : "100%",
              }}
              transition={{ type: "spring", bounce: 0.4, duration: 0.7 }}
              style={{ left: 4 }}
            />
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`relative font-mono w-[72px] py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase transition-colors z-10 ${billingCycle === "monthly" ? "text-paper dark:text-emerald-accent" : "text-paper/40 dark:text-blueprint/40"}`}
            >
              {monthlyLabel}
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`relative font-mono w-[72px] py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase transition-colors z-10 ${billingCycle === "yearly" ? "text-paper dark:text-emerald-accent" : "text-paper/40 dark:text-blueprint/40"}`}
            >
              {yearlyLabel}
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="flex flex-col gap-1">
          {plans.map((plan) => {
            const isSelected = selectedPlan === plan.id;

            return (
              <motion.div
                layout
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                transition={{ type: "spring", bounce: 0.45, duration: 0.7 }}
                className={`relative overflow-hidden cursor-pointer rounded-[18px] transition-colors duration-300 bg-blueprint dark:bg-paper/50 ${
                  isSelected
                    ? "ring-[1.5px] ring-emerald-accent shadow-[0_4px_16px_rgba(16,185,129,0.06)] dark:shadow-none"
                    : "ring-1 ring-paper/10 dark:ring-blueprint/10 shadow-sm dark:shadow-none hover:ring-paper/20 dark:hover:ring-blueprint/20"
                }`}
              >
                <div className="px-4 py-3.5 sm:px-5 sm:py-4">
                  {/* Top row */}
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex gap-3">
                      {/* Radio button */}
                      <div className="mt-0.5 shrink-0">
                        <div
                          className={`w-[18px] h-[18px] rounded-full flex items-center justify-center border transition-colors ${
                            isSelected
                              ? "border-emerald-accent bg-emerald-accent"
                              : "border-paper/20 dark:border-blueprint/20 bg-blueprint dark:bg-transparent"
                          }`}
                        >
                          {isSelected && (
                            <Check
                              size={11}
                              strokeWidth={3.5}
                              className="text-blueprint"
                            />
                          )}
                        </div>
                      </div>

                      {/* Plan Info */}
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-[16px] font-serif font-medium text-paper dark:text-blueprint leading-none">
                            {plan.name}
                          </span>
                          {plan.badge && (
                            <span className="bg-emerald-accent/10 text-emerald-accent text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider leading-none">
                              {plan.badge}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-sans text-paper/50 dark:text-blueprint/50 mt-1.5 leading-none">
                          {plan.description}
                        </span>
                      </div>
                    </div>

                    {/* Price Info */}
                    <div className="flex flex-col items-end">
                      <div className="flex items-center justify-end text-[15px] sm:text-[16px] font-serif font-medium text-paper dark:text-blueprint leading-none overflow-hidden h-[18px]">
                        <AnimatePresence mode="popLayout" initial={false}>
                          <motion.span
                            key={billingCycle}
                            initial={{
                              y: billingCycle === "yearly" ? 20 : -20,
                              opacity: 0,
                              filter: "blur(4px)",
                            }}
                            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                            exit={{
                              y: billingCycle === "monthly" ? -20 : 20,
                              opacity: 0,
                              filter: "blur(4px)",
                            }}
                            transition={{
                              type: "spring",
                              bounce: 0,
                              duration: 0.4,
                            }}
                            className="inline-block whitespace-nowrap"
                          >
                            {billingCycle === "monthly"
                              ? plan.priceMonthly
                              : plan.priceYearly}
                          </motion.span>
                        </AnimatePresence>
                      </div>
                      <span className="font-mono text-[10px] text-paper/40 dark:text-blueprint/40 font-bold tracking-widest uppercase mt-1.5 leading-none">
                        per user/month
                      </span>
                    </div>
                  </div>

                  {/* Expandable Features */}
                  <AnimatePresence initial={false}>
                    {isSelected && (
                      <motion.div
                        key="features"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                          opacity: { duration: 0.2 },
                          height: { duration: 0.3, ease: "easeOut" },
                        }}
                        className="overflow-hidden"
                      >
                        <div className="pt-3.5 mt-3.5 sm:pt-4 sm:mt-4 mb-1 border-t border-dashed border-paper/10 dark:border-blueprint/10">
                          {plan.featuresLabel && (
                            <p className="font-mono text-[10px] font-bold text-paper/40 dark:text-blueprint/40 tracking-widest uppercase mb-3">
                              {plan.featuresLabel}
                            </p>
                          )}
                          <div className="flex flex-col gap-2.5">
                            {plan.features.map((feature, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2.5"
                              >
                                <Check
                                  size={14}
                                  strokeWidth={3}
                                  className="text-emerald-accent shrink-0"
                                />
                                <span className="text-[12px] font-sans text-paper/70 dark:text-blueprint/70 leading-tight">
                                  {feature.text}
                                </span>
                                {feature.hasInfo && (
                                  <Info
                                    size={13}
                                    className="text-paper/20 dark:text-blueprint/20 ml-0.5"
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer info & CTA */}
        <div className="flex items-center justify-between mt-5 px-1 pb-1">
          <span className="font-mono text-[10px] text-paper/40 dark:text-blueprint/40 uppercase tracking-[0.05em] max-w-[190px] leading-relaxed whitespace-nowrap">
            {footerText}
          </span>
          <Button
            onClick={() => onContinue?.(selectedPlan, billingCycle)}
            className="h-10 px-6"
            hoverText={buttonHoverText}
          >
            {buttonText}
          </Button>
        </div>
      </div>
    </div>
  );
}
