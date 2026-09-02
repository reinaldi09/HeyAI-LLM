"use client";

import { cn } from "@/lib/utils";
import type { OutputMode } from "@/lib/api";
import { FileText, BookOpen } from "lucide-react";

interface OutputModeSelectorProps {
  value: OutputMode;
  onChange: (mode: OutputMode) => void;
  disabled?: boolean;
  selectedOnly?: boolean;
}

const modes: {
  value: OutputMode;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "summary",
    label: "Ringkas",
    description: "Ringkasan singkat DRP & rencana",
    icon: <FileText size={16} />,
  },
  {
    value: "expanded",
    label: "Lengkap",
    description: "Rasionalisasi lengkap & intervensi rinci",
    icon: <BookOpen size={16} />,
  },
];

export function OutputModeSelector({ value, onChange, disabled = false, selectedOnly = false }: OutputModeSelectorProps) {
  const visibleModes = selectedOnly ? modes.filter((mode) => mode.value === value) : modes;

  return (
    <div>
      <label className="block text-sm font-medium text-ink-800 mb-2">
        Mode keluaran
      </label>
      <div className={cn("grid gap-2", selectedOnly ? "grid-cols-1" : "grid-cols-2")}>
        {visibleModes.map((mode) => (
          <button
            key={mode.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(mode.value)}
            className={cn(
              "relative flex items-start gap-3 rounded-xl border p-3 text-left shadow-[0_1px_0_rgba(31,52,85,0.03)]",
              "transition-all duration-200",
              disabled ? "cursor-not-allowed" : "cursor-pointer",
              value === mode.value
                ? "border-sage-300 bg-gradient-to-l from-sage-900 via-sage-700 to-sage-500 text-white shadow-[0_16px_38px_rgba(31,82,146,0.24)]"
                : "border-white/70 bg-white/55 hover:border-sage-200 hover:bg-white/80"
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex-shrink-0",
                value === mode.value ? "text-white" : "text-ink-400"
              )}
            >
              {mode.icon}
            </span>
            <div>
              <div
                className={cn(
                  "text-sm font-medium",
                  value === mode.value ? "text-white" : "text-ink-700"
                )}
              >
                {mode.label}
              </div>
              <div className={cn("mt-0.5 text-xs leading-snug", value === mode.value ? "text-sage-100/85" : "text-ink-400")}>
                {mode.description}
              </div>
            </div>
            {value === mode.value && (
              <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-gold-200 shadow-[0_0_0_4px_rgba(242,228,195,0.18)]" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
