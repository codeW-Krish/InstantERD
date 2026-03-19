import * as React from "react";
import { cn } from "../lib/utils";

const TextureCardStyled = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-[24px] border border-paper/10 bg-blueprint/40 backdrop-blur-xl shadow-2xl overflow-hidden",
      className
    )}
    {...props}
  />
));
TextureCardStyled.displayName = "TextureCardStyled";

const TextureCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
TextureCardHeader.displayName = "TextureCardHeader";

const TextureCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-serif leading-none tracking-tight text-paper",
      className
    )}
    {...props}
  />
));
TextureCardTitle.displayName = "TextureCardTitle";

const TextureCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
TextureCardContent.displayName = "TextureCardContent";

const TextureCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
TextureCardFooter.displayName = "TextureCardFooter";

const TextureSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("h-px bg-paper/5 w-full my-4", className)}
    {...props}
  />
));
TextureSeparator.displayName = "TextureSeparator";

export {
  TextureCardStyled,
  TextureCardHeader,
  TextureCardFooter,
  TextureCardTitle,
  TextureCardContent,
  TextureSeparator,
};
