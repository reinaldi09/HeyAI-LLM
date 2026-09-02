"use client";

import { BookOpen, CircleUserRound, FileText, LogOut, Shield, Stethoscope, Users } from "lucide-react";
import type { UserResponse } from "@/lib/api";
import { cn } from "@/lib/utils";

export type AppView = "assessment" | "patients" | "documents" | "users" | "profile";

interface HeaderProps {
  user?: UserResponse | null;
  view?: AppView;
  onViewChange?: (view: AppView) => void;
  onLogout?: () => void;
}

const NAV_ITEMS = [
  { key: "assessment" as const, label: "Asesmen", icon: Stethoscope, roles: ["apoteker"] },
  { key: "patients" as const, label: "Pasien", icon: BookOpen, roles: ["apoteker", "superadmin"] },
  { key: "profile" as const, label: "Profil", icon: CircleUserRound, roles: ["apoteker"] },
  { key: "documents" as const, label: "Data PDF", icon: FileText, roles: ["superadmin"] },
  { key: "users" as const, label: "Apoteker", icon: Users, roles: ["superadmin"] },
];

function roleLabel(role: string) {
  return role === "superadmin" ? "Superadmin" : "Apoteker";
}

function NavItems({ user, view, onViewChange, variant }: HeaderProps & { variant: "desktop" | "mobile" }) {
  if (!user) return null;

  return (
    <nav className={cn("flex gap-1", variant === "desktop" ? "flex-col" : "flex-wrap")}>
      {NAV_ITEMS.filter((item) => item.roles.includes(user.role)).map((item) => {
        const Icon = item.icon;
        const active = view === item.key;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onViewChange?.(item.key)}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
              variant === "desktop"
                ? active
                  ? "border border-gold-200/40 bg-white/[0.14] text-white shadow-[0_14px_34px_rgba(3,15,36,0.24)] backdrop-blur-xl"
                  : "border border-transparent text-sage-100/80 hover:border-white/10 hover:bg-white/10 hover:text-white"
                : active
                  ? "bg-sage-700 text-white shadow-sm"
                  : "text-ink-500 hover:bg-sage-50 hover:text-sage-800"
            )}
          >
            <Icon size={16} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

export function Header({ user, view = "assessment", onViewChange, onLogout }: HeaderProps) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/70 bg-white/70 shadow-sm backdrop-blur-2xl lg:hidden">
        <div className="flex flex-col gap-4 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <img src="/logo-white.png" alt="PharmaCare Logo" className="h-9 w-36 object-contain object-center" />
            {user && (
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center justify-center rounded-lg border border-white/70 bg-white/80 p-2 text-ink-500 shadow-sm hover:bg-white hover:text-ink-800"
                title="Keluar"
              >
                <LogOut size={14} />
              </button>
            )}
          </div>
          <NavItems user={user} view={view} onViewChange={onViewChange} variant="mobile" />
        </div>
      </header>

      <aside className="sticky top-0 hidden h-screen overflow-hidden flex-col bg-[radial-gradient(circle_at_15%_10%,rgba(214,183,118,0.20),transparent_18rem),linear-gradient(155deg,#102449_0%,#173765_52%,#0a1832_100%)] px-5 py-6 text-white shadow-[12px_0_44px_rgba(9,24,54,0.18)] lg:flex">
        <svg
          viewBox="0 0 760 520"
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 top-8 h-[250px] w-[360px] opacity-[0.12] drop-shadow-[0_10px_20px_rgba(0,0,0,0.10)]"
        >
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            <g stroke="#f7e9c7" strokeWidth="3" opacity="0.56">
              <path d="M95 95v84c0 58 39 96 91 96s91-38 91-96V95" />
              <path d="M95 95c0-20 32-20 32 0M245 95c0-20 32-20 32 0" />
              <path d="M186 275v52c0 44 35 80 79 80h37" />
              <circle cx="338" cy="407" r="37" />
            </g>
            <g stroke="#ffffff" strokeWidth="2" opacity="0.42">
              <path d="M398 112h96M446 64v96" />
            </g>
          </g>
        </svg>
        <svg
          viewBox="0 0 760 520"
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-28 -left-36 h-[280px] w-[400px] opacity-[0.10] drop-shadow-[0_10px_20px_rgba(0,0,0,0.08)]"
        >
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            <g stroke="#f7e9c7" strokeWidth="3" opacity="0.56">
              <path d="M475 88v76l-62 146c-15 36 11 76 50 76h88c39 0 65-40 50-76l-62-146V88" />
              <path d="M454 88h106M441 274h132M460 326h94" />
              <circle cx="491" cy="244" r="7" />
              <circle cx="535" cy="308" r="10" />
              <path d="M250 146v58l-42 112c-12 32 12 66 46 66h62c34 0 58-34 46-66l-42-112v-58" />
              <path d="M234 146h102M226 286h120" />
            </g>
            <g stroke="#ffffff" strokeWidth="2" opacity="0.42">
              <path d="M53 452c70-24 122-24 192 0s122 24 192 0 122-24 192 0" />
            </g>
          </g>
        </svg>
        <svg
          viewBox="0 0 760 520"
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[430px] -translate-x-1/2 -translate-y-1/2 opacity-[0.08] drop-shadow-[0_10px_20px_rgba(0,0,0,0.08)]"
        >
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            <g stroke="#f7e9c7" strokeWidth="3" opacity="0.56">
              <path d="M95 95v84c0 58 39 96 91 96s91-38 91-96V95" />
              <path d="M95 95c0-20 32-20 32 0M245 95c0-20 32-20 32 0" />
              <path d="M186 275v52c0 44 35 80 79 80h37" />
              <circle cx="338" cy="407" r="37" />
              <path d="M520 86v92l-82 168c-19 39 10 84 53 84h116c43 0 72-45 53-84l-82-168V86" />
              <path d="M500 86h98M475 292h147M494 346h110" />
            </g>
            <g stroke="#ffffff" strokeWidth="2" opacity="0.42">
              <path d="M53 452c70-24 122-24 192 0s122 24 192 0 122-24 192 0" />
              <path d="M398 112h96M446 64v96" />
            </g>
          </g>
        </svg>
        <div className="inline-flex backdrop-blur-2xl py-3">
          <img src="/logo-white.png" alt="PharmaCare Logo" className="h-14 w-48 object-contain object-center" />
        </div>

        <div className="relative z-10 mt-8">
          <p className="mb-3 px-2 text-[11px] font-medium uppercase tracking-[0.18em] text-sage-200">
            Navigasi
          </p>
          <NavItems user={user} view={view} onViewChange={onViewChange} variant="desktop" />
        </div>

        {user && (
          <div className="relative z-10 mt-auto space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-2 py-1 text-[11px] text-sage-100">
                <Shield size={12} />
                {roleLabel(user.role)}
              </span>
              <p className="truncate text-sm font-medium text-white">{user.nama}</p>
              <p className="truncate text-xs text-sage-100/70">@{user.username}</p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2.5 text-sm text-sage-50 transition-colors hover:bg-white/15"
            >
              <LogOut size={15} />
              Keluar
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
