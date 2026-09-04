"use client";

import { useState } from "react";
import { AssessmentResultView } from "@/components/AssessmentResultView";
import { BookMarked, CheckCheck, ChevronDown, ChevronUp, Copy, Database, User } from "lucide-react";
import type { PasienSingkat, PharmaResponse } from "@/lib/api";

interface ResultPanelProps {
  result: PharmaResponse;
  pasien: PasienSingkat | null;
  onReset: () => void;
}

export function ResultPanel({ result, pasien, onReset }: ResultPanelProps) {
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result.result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-fade-up space-y-4">
      {(pasien || result.rekam_medis_id) && (
        <div className="flex flex-wrap gap-2">
          {pasien && (
            <div className="flex items-center gap-2 rounded-full border border-sage-200 bg-sage-50 px-3 py-1.5 text-xs text-sage-700">
              <User size={11} />
              {pasien.nama}
            </div>
          )}
          {result.rekam_medis_id && (
            <div className="flex items-center gap-2 rounded-full border border-ink-200 bg-ink-50 px-3 py-1.5 text-xs text-ink-600">
              <Database size={11} />
              Tersimpan - Rekam medis {result.nomor_rekam_medis || result.rekam_medis_id}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-sage-700">
            <BookMarked size={12} className="text-sage-100" />
          </div>
          <h2 className="text-sm font-medium text-ink-800">Hasil asesmen farmasi</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-ink-500 transition-all duration-150 hover:bg-ink-100 hover:text-ink-800"
          >
            {copied ? (
              <>
                <CheckCheck size={13} className="text-sage-600" />
                <span className="text-sage-600">Tersalin</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span>Salin</span>
              </>
            )}
          </button>
          <button
            onClick={onReset}
            className="rounded-lg px-3 py-1.5 text-xs text-ink-400 transition-all duration-150 hover:bg-ink-100 hover:text-ink-700"
          >
            Asesmen baru
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-white/70 bg-white/[0.72] shadow-[0_22px_70px_rgba(31,52,85,0.10)] backdrop-blur-2xl">
        <div className="p-6">
          <AssessmentResultView content={result.result} />
        </div>
        <div className="border-t border-ink-100">
          <button
            onClick={() => setShowRaw(!showRaw)}
            className="flex w-full items-center justify-between px-6 py-3 text-xs text-ink-400 transition-colors hover:bg-ink-50/50 hover:text-ink-600"
          >
            <span className="font-mono">Respons mentah</span>
            {showRaw ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          {showRaw && (
            <div className="px-6 pb-4">
              <pre className="max-h-60 overflow-auto whitespace-pre-wrap rounded-xl bg-ink-50 p-4 font-mono text-xs leading-relaxed text-ink-500">
                {result.result}
              </pre>
            </div>
          )}
        </div>
      </div>

      <p className="text-center text-xs leading-relaxed text-ink-400">
        Keluaran ini dihasilkan oleh AI berdasarkan konteks dari panduan klinis.
        <br />
        Selalu terapkan penilaian klinis profesional sebelum memberikan rekomendasi.
      </p>
    </div>
  );
}
