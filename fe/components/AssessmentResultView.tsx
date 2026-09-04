"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

function splitAssessment(content: string): { summary: string; detailed: string } {
  const marker = content.indexOf("🔍 DETAILED ASSESSMENT & PLAN");
  if (marker === -1) {
    return { summary: content, detailed: content };
  }
  const summary = content.slice(0, marker).trim();
  const detailed = content.slice(marker).trim();
  return { summary, detailed: detailed || content };
}

export function AssessmentResultView({ content }: { content: string }) {
  const [view, setView] = useState<"summary" | "detailed">("summary");
  const { summary, detailed } = splitAssessment(content);

  return (
    <div>
      <div className="mb-3 flex gap-1 rounded-lg bg-ink-100/70 p-1">
        <button
          type="button"
          onClick={() => setView("summary")}
          className={cn(
            "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            view === "summary"
              ? "bg-white text-sage-700 shadow-sm"
              : "text-ink-500 hover:text-ink-700"
          )}
        >
          Ringkasan
        </button>
        <button
          type="button"
          onClick={() => setView("detailed")}
          className={cn(
            "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            view === "detailed"
              ? "bg-white text-sage-700 shadow-sm"
              : "text-ink-500 hover:text-ink-700"
          )}
        >
          Lengkap
        </button>
      </div>
      <div className="prose-clinical max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {view === "summary" ? summary : detailed}
        </ReactMarkdown>
      </div>
    </div>
  );
}
