"use client";

import type { ReactNode } from "react";

export const inputClassName =
  "w-full rounded-2xl border border-sage-100/90 bg-white/75 px-4 py-3 text-sm text-ink-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_26px_rgba(31,52,85,0.07)] backdrop-blur-xl placeholder:text-ink-300 hover:border-sage-200 hover:bg-white/85 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_14px_34px_rgba(31,52,85,0.10)] focus:outline-none focus:border-sage-400 focus:bg-white focus:ring-4 focus:ring-sage-100/80";

export function FormField({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`group relative pt-2 [&_input]:pb-3 [&_input]:pt-4 [&_select]:pb-3 [&_select]:pt-4 [&_textarea]:pb-3 [&_textarea]:pt-4 ${className}`}
    >
      <span className="pointer-events-none absolute left-4 top-0 z-10 bg-gradient-to-r from-white/95 via-porcelain to-white/95 px-1.5 text-[11px] font-medium text-ink-400 group-focus-within:text-sage-700">
        {label}
      </span>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="relative overflow-hidden border-b border-white/70 bg-white/55 shadow-[0_1px_0_rgba(255,255,255,0.75)] backdrop-blur-2xl">
      <svg
        viewBox="0 0 760 520"
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-28 hidden h-[320px] w-[460px] opacity-[0.10] drop-shadow-[0_10px_24px_rgba(31,52,85,0.08)] lg:block"
      >
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <g stroke="#284b83" strokeWidth="3" opacity="0.52">
            <path d="M95 95v84c0 58 39 96 91 96s91-38 91-96V95" />
            <path d="M95 95c0-20 32-20 32 0M245 95c0-20 32-20 32 0" />
            <path d="M186 275v52c0 44 35 80 79 80h37" />
            <circle cx="338" cy="407" r="37" />
            <path d="M520 86v92l-82 168c-19 39 10 84 53 84h116c43 0 72-45 53-84l-82-168V86" />
            <path d="M500 86h98M475 292h147M494 346h110" />
          </g>
          <g stroke="#d6b676" strokeWidth="2" opacity="0.38">
            <path d="M53 452c70-24 122-24 192 0s122 24 192 0 122-24 192 0" />
            <path d="M398 112h96M446 64v96" />
          </g>
        </g>
      </svg>
      <div className="relative z-10 mx-auto max-w-6xl px-6 py-8">
        <div className="mb-4 h-1 w-14 rounded-full bg-gradient-to-r from-sage-700 via-sage-400 to-gold-300" />
        <h1 className="font-display text-3xl text-ink-900 sm:text-4xl">{title}</h1>
        {description && (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-500">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

export function PageBody({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <main className={`mx-auto max-w-6xl px-6 py-8 ${className}`}>{children}</main>;
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-[24px] border border-white/70 bg-white/[0.72] shadow-[0_22px_70px_rgba(31,52,85,0.10)] backdrop-blur-2xl ${className}`}>
      {children}
    </section>
  );
}

export function InfoField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs text-ink-400">{label}</p>
      <div className="text-sm text-ink-700">{value}</div>
    </div>
  );
}
