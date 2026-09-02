"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { OutputMode } from "@/lib/api";

export function AssessmentHistoryContent({
  content,
  outputMode,
}: {
  content: string;
  outputMode: OutputMode;
}) {
  return (
    <div className="mt-4 rounded-xl border border-sage-100 bg-sage-50/60 p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <p className="text-xs font-medium text-sage-700">Hasil asesmen</p>
        <span className="rounded-full border border-sage-200 bg-white px-2 py-0.5 text-[11px] font-medium text-sage-700">
          {outputMode === "expanded" ? "Lengkap" : "Ringkas"}
        </span>
      </div>
      <div className="prose-clinical max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
