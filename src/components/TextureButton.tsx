import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";

interface TextureButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "accent" | "icon";
  hoverText?: string;
  children: React.ReactNode;
}

const TextureButton = React.forwardRef<HTMLButtonElement, TextureButtonProps>(
  ({ className, variant = "default", hoverText, children, ...props }, ref) => {
    const [isHovered, setIsHovered] = React.useState(false);

    const variants = {
      default: "bg-paper text-blueprint hover:bg-paper/90",
      outline: "border border-paper/10 bg-transparent text-paper hover:bg-paper/5",
      ghost: "bg-transparent text-paper hover:bg-paper/5",
      accent: "bg-emerald-accent text-blueprint hover:bg-emerald-accent/90",
      icon: "border border-paper/10 bg-blueprint/40 text-paper hover:bg-blueprint/60 p-2",
    };

    return (
      <button
        ref={ref}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "relative h-11 px-6 rounded-xl font-mono text-[10px] uppercase tracking-[0.2em] transition-all duration-300 overflow-hidden flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
          variants[variant],
          className
        )}
        {...props}
      >
        <AnimatePresence mode="wait">
          {!isHovered || !hoverText ? (
            <motion.div
              key="text"
              initial={{ y: 0, opacity: 1 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              {children}
            </motion.div>
          ) : (
            <motion.div
              key="hover"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              {hoverText}
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    );
  }
);
TextureButton.displayName = "TextureButton";

export { TextureButton };
