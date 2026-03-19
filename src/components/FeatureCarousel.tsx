import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";
import { ArrowRight, Terminal, Cpu, Database, Layout } from "lucide-react";

interface FeatureCarouselProps {
  title: string;
  description: string;
  steps: {
    id: number;
    title: string;
    description: string;
    icon: React.ElementType;
    images: string[];
  }[];
  className?: string;
}

export function FeatureCarousel({
  title,
  description,
  steps,
  className,
}: FeatureCarouselProps) {
  const [activeStep, setActiveStep] = React.useState(0);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 4000); // 4 second interval
    return () => clearTimeout(timer);
  }, [activeStep, steps.length]);

  return (
    <div className={cn("w-full max-w-6xl mx-auto", className)}>
      <div className="mb-16 text-center lg:text-left">
        <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-emerald-accent mb-4 block">Interactive Demo</span>
        <h2 className="text-4xl md:text-6xl font-serif mb-6">{title}</h2>
        <p className="text-paper/60 max-w-2xl font-mono text-xs uppercase tracking-widest">{description}</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-12 items-center">
        {/* Left: Navigation Steps */}
        <div className="lg:col-span-5 space-y-4">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => setActiveStep(index)}
              className={cn(
                "w-full text-left p-6 border transition-all duration-500 group relative overflow-hidden",
                activeStep === index
                  ? "border-emerald-accent/30 bg-emerald-accent/5 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]"
                  : "border-paper/5 bg-transparent hover:bg-paper/[0.02]"
              )}
            >
              {activeStep === index && (
                <>
                  <motion.div
                    layoutId="active-indicator"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-accent"
                  />
                  {/* Progress Bar */}
                  <motion.div
                    key={`progress-${activeStep}`}
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 4, ease: "linear" }}
                    className="absolute bottom-0 left-0 h-[2px] bg-emerald-accent/40"
                  />
                  {/* Scanning Line */}
                  <motion.div
                    initial={{ top: "0%" }}
                    animate={{ top: "100%" }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 right-0 h-[1px] bg-emerald-accent/10 z-0 pointer-events-none"
                  />
                </>
              )}
              <div className="flex items-start gap-4">
                <div className={cn(
                  "w-10 h-10 border flex items-center justify-center transition-colors duration-500",
                  activeStep === index ? "border-emerald-accent text-emerald-accent" : "border-paper/10 text-paper/30"
                )}>
                  <step.icon size={18} />
                </div>
                <div className="flex-1">
                  <h3 className={cn(
                    "font-serif text-xl mb-2 transition-colors duration-500",
                    activeStep === index ? "text-paper" : "text-paper/40"
                  )}>
                    {step.title}
                  </h3>
                  <p className={cn(
                    "font-mono text-[10px] uppercase tracking-widest leading-relaxed transition-colors duration-500",
                    activeStep === index ? "text-paper/60" : "text-paper/20"
                  )}>
                    {step.description}
                  </p>
                </div>
                <ArrowRight 
                  size={16} 
                  className={cn(
                    "mt-1 transition-all duration-500",
                    activeStep === index ? "text-emerald-accent translate-x-0 opacity-100" : "text-paper/10 -translate-x-2 opacity-0"
                  )} 
                />
              </div>
            </button>
          ))}
        </div>

        {/* Right: Animated Visuals */}
        <div className="lg:col-span-7 aspect-square lg:aspect-video relative border border-paper/10 bg-blueprint/40 overflow-hidden rounded-sm">
          <div className="absolute inset-0 grid-bg opacity-10" />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
              className="absolute inset-0 flex items-center justify-center p-12"
            >
              <div className="relative w-full h-full">
                {/* Step-specific visual logic */}
                {activeStep === 0 && (
                  <div className="w-full h-full flex items-center justify-center">
                    <motion.div 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="w-full max-w-md bg-blueprint border border-emerald-accent/20 p-6 rounded-sm shadow-2xl"
                    >
                      <div className="flex items-center gap-2 mb-4 border-b border-paper/5 pb-2">
                        <Terminal size={12} className="text-emerald-accent" />
                        <span className="font-mono text-[8px] text-paper/40 uppercase tracking-widest">Natural_Language_Parser.exe</span>
                      </div>
                      <p className="font-serif italic text-paper/80 text-lg mb-4">
                        "A user can have multiple posts, and each post has comments."
                      </p>
                      <div className="flex gap-2">
                        <div className="h-1 flex-1 bg-emerald-accent/20 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="h-full bg-emerald-accent"
                          />
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}

                {activeStep === 1 && (
                  <div className="w-full h-full flex items-center justify-center gap-8">
                    {[
                      { name: "User", color: "bg-emerald-500/10" },
                      { name: "Post", color: "bg-blue-500/10" },
                      { name: "Comment", color: "bg-indigo-500/10" }
                    ].map((entity, i) => (
                      <motion.div
                        key={i}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className={cn("w-32 h-40 border border-paper/10 p-4 flex flex-col items-center justify-center gap-4", entity.color)}
                      >
                        <Cpu size={24} className="text-paper/20" />
                        <span className="font-mono text-[10px] uppercase tracking-widest text-paper/60">{entity.name}</span>
                        <div className="space-y-1 w-full">
                          <div className="h-1 bg-paper/5 w-full" />
                          <div className="h-1 bg-paper/5 w-3/4" />
                          <div className="h-1 bg-paper/5 w-1/2" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {activeStep === 2 && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="relative flex flex-col items-center gap-12">
                      <motion.div 
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="w-32 h-16 border border-emerald-accent bg-emerald-accent/5 flex items-center justify-center"
                      >
                        <span className="font-mono text-xs font-bold">USER</span>
                      </motion.div>
                      
                      <div className="w-8 h-8 border border-emerald-accent rotate-45 flex items-center justify-center bg-blueprint">
                        <div className="-rotate-45 font-mono text-[8px] text-emerald-accent">1:N</div>
                      </div>

                      <motion.div 
                        animate={{ y: [0, 5, 0] }}
                        transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                        className="w-32 h-16 border border-emerald-accent bg-emerald-accent/5 flex items-center justify-center"
                      >
                        <span className="font-mono text-xs font-bold">POST</span>
                      </motion.div>

                      <div className="absolute top-8 w-[1px] h-48 bg-emerald-accent/20 -z-10" />
                    </div>
                  </div>
                )}

                {activeStep === 3 && (
                  <div className="w-full h-full flex items-center justify-center">
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="w-full max-w-md bg-neutral-900 border border-paper/10 p-8 rounded-sm font-mono text-xs text-emerald-accent/80 shadow-2xl"
                    >
                      <div className="flex items-center justify-between mb-6 opacity-40">
                        <span className="text-[8px] uppercase tracking-[0.4em]">schema_export.sql</span>
                        <div className="flex gap-1">
                          <div className="w-2 h-2 rounded-full bg-red-500/20" />
                          <div className="w-2 h-2 rounded-full bg-yellow-500/20" />
                          <div className="w-2 h-2 rounded-full bg-green-500/20" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p><span className="text-blue-400">CREATE TABLE</span> users (</p>
                        <p className="pl-4">id <span className="text-orange-400">SERIAL PRIMARY KEY</span>,</p>
                        <p className="pl-4">email <span className="text-orange-400">VARCHAR(255) UNIQUE</span>,</p>
                        <p className="pl-4">created_at <span className="text-orange-400">TIMESTAMP DEFAULT NOW()</span></p>
                        <p>);</p>
                        <p className="mt-4"><span className="text-blue-400">CREATE TABLE</span> posts (</p>
                        <p className="pl-4">id <span className="text-orange-400">SERIAL PRIMARY KEY</span>,</p>
                        <p className="pl-4">user_id <span className="text-orange-400">INTEGER REFERENCES</span> users(id)</p>
                        <p>);</p>
                      </div>
                    </motion.div>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Decorative Corner Accents */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-emerald-accent/30" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-emerald-accent/30" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-emerald-accent/30" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-emerald-accent/30" />
        </div>
      </div>
    </div>
  );
}
