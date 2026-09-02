"use client";

import { BookOpen, Shield, Database } from "lucide-react";

const SOURCES = [
  {
    title: "ADA Standards of Care 2026",
    type: "Internasional",
    color: "text-blue-600 bg-blue-50 border-blue-100",
  },
  {
    title: "Perkeni Konsensus DM 2024",
    type: "Nasional",
    color: "text-sage-600 bg-sage-50 border-sage-100",
  },
  {
    title: "PNPK DM Dewasa 2020",
    type: "Nasional",
    color: "text-sage-600 bg-sage-50 border-sage-100",
  },
];

const LIMITATIONS = [
  "Tidak menegakkan diagnosis medis",
  "Tidak memodifikasi data S/O yang diinput",
  "Sitasi hanya dari konteks yang ditemukan",
  "Menyatakan keterbatasan bukti secara eksplisit",
];

export function SidebarInfo() {
  return (
    <div className="space-y-5">
      {/* Knowledge base */}
      <div className="bg-white rounded-2xl border border-ink-100 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Database size={14} className="text-sage-600" />
          <h3 className="text-xs font-medium text-ink-700 uppercase tracking-wider">
            Knowledge Base
          </h3>
        </div>
        <div className="space-y-2.5">
          {SOURCES.map((s) => (
            <div
              key={s.title}
              className="flex items-start gap-2.5"
            >
              <span
                className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 mt-0.5 font-medium ${s.color}`}
              >
                {s.type}
              </span>
              <span className="text-xs text-ink-600 leading-relaxed">
                {s.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="bg-white rounded-2xl border border-ink-100 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={14} className="text-sage-600" />
          <h3 className="text-xs font-medium text-ink-700 uppercase tracking-wider">
            Cara Kerja
          </h3>
        </div>
        <ol className="space-y-3">
          {[
            "Data S/O dikodekan menjadi vektor embedding",
            "Sistem mencari konteks relevan di ChromaDB",
            "LLM merangkai asesmen berdasarkan panduan klinis",
            "Setiap rekomendasi disertai sitasi referensi",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-sage-100 text-sage-700 text-xs flex items-center justify-center font-medium mt-0.5">
                {i + 1}
              </span>
              <span className="text-xs text-ink-600 leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Safety */}
      <div className="bg-white rounded-2xl border border-ink-100 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={14} className="text-sage-600" />
          <h3 className="text-xs font-medium text-ink-700 uppercase tracking-wider">
            Batasan Sistem
          </h3>
        </div>
        <ul className="space-y-2">
          {LIMITATIONS.map((l, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="flex-shrink-0 w-1 h-1 rounded-full bg-sage-400 mt-2" />
              <span className="text-xs text-ink-500 leading-relaxed">{l}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
