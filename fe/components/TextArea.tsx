"use client";

import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
  charCount?: number;
  maxChars?: number;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, sublabel, icon, charCount, maxChars, className, ...props }, ref) => {
    return (
      <div className="group">
        <div className="mb-2 flex items-start justify-between">
          <div className="flex items-center gap-2 text-ink-500">
            {icon && (
              <span className="text-sage-600 mt-0.5">{icon}</span>
            )}
            {sublabel && <span className="text-xs text-ink-400">{sublabel}</span>}
          </div>
          {maxChars && charCount !== undefined && (
            <span
              className={cn(
                "text-xs tabular-nums mt-0.5",
                charCount > maxChars * 0.9
                  ? "text-amber-600"
                  : "text-ink-300"
              )}
            >
              {charCount}/{maxChars}
            </span>
          )}
        </div>
        <div className="relative pt-2">
          <label className="pointer-events-none absolute left-4 top-0 z-10 bg-gradient-to-r from-white/95 via-porcelain to-white/95 px-1.5 text-[11px] font-medium text-ink-400 group-focus-within:text-sage-700">
            {label}
          </label>
          <textarea
            ref={ref}
            className={cn(
              "w-full rounded-2xl border border-sage-100/90 bg-white/75 px-4 pb-3 pt-4",
              "text-sm text-ink-800 placeholder:text-ink-300",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_26px_rgba(31,52,85,0.07)] hover:border-sage-200 hover:bg-white/85 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_14px_34px_rgba(31,52,85,0.10)] focus:outline-none focus:border-sage-400 focus:bg-white focus:ring-4 focus:ring-sage-100/80",
              "transition-all duration-200 resize-none font-sans",
              "min-h-[140px] leading-relaxed",
              className
            )}
            {...props}
          />
          {/* Bottom accent line */}
          <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-sage-300/0 to-transparent group-focus-within:via-sage-400 transition-all duration-500" />
        </div>
      </div>
    );
  }
);

TextArea.displayName = "TextArea";
