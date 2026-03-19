import { motion } from "motion/react";
import { ReactNode } from "react";
import { cn } from "../lib/utils";

interface ButtonProps {
  children: ReactNode;
  hoverText?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
  disabled?: boolean;
}

export const Button = ({ children, hoverText, onClick, variant = 'primary', className = '', disabled = false }: ButtonProps) => {
  const variants = {
    primary: "bg-emerald-accent text-blueprint hover:bg-emerald-accent/90",
    secondary: "bg-paper text-blueprint hover:bg-paper/90",
    outline: "border border-paper/20 text-paper hover:bg-paper/5"
  };

  const slideText = hoverText ?? children;

  return (
    <motion.button
      whileTap={disabled ? {} : { scale: 0.98 }}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cn(
        "group relative inline-flex h-12 items-center justify-center overflow-hidden px-8 font-mono text-xs uppercase tracking-widest transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        className
      )}
    >
      <span className="relative inline-block transition-transform duration-300 ease-in-out group-hover:-translate-y-full">
        <span className="flex items-center gap-2 opacity-100 transition-opacity duration-300 group-hover:opacity-0">
          <span className="font-medium">{children}</span>
        </span>
        <span className="absolute top-full left-0 flex items-center gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="font-medium">{slideText}</span>
        </span>
      </span>
    </motion.button>
  );
};
