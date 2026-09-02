"use client";

export function LoadingIndicator() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 rounded-[24px] border border-white/70 bg-white/55 py-16 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] backdrop-blur-2xl">
      {/* Animated scanner */}
      <div className="relative w-14 h-14">
        <div className="w-14 h-14 rounded-2xl border-2 border-sage-200 relative overflow-hidden">
          <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-sage-500 to-transparent animate-scan opacity-80" />
        </div>
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-sage-600 rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-sage-600 rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-sage-600 rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-sage-600 rounded-br-lg" />
      </div>

      <div className="text-center">
        <p className="text-sm font-medium text-ink-700">Menganalisis data klinis</p>
        <p className="text-xs text-ink-400 mt-1">
          Mencari referensi dari panduan ADA, Perkeni & PNPK...
        </p>
      </div>

      {/* Dots */}
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 bg-sage-400 rounded-full dot-1" />
        <span className="w-1.5 h-1.5 bg-sage-400 rounded-full dot-2" />
        <span className="w-1.5 h-1.5 bg-sage-400 rounded-full dot-3" />
      </div>
    </div>
  );
}
