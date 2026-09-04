"use client";

import { AssessmentResultView } from "@/components/AssessmentResultView";

export function AssessmentHistoryContent({ content }: { content: string }) {
  return (
    <div className="mt-4 rounded-xl border border-sage-100 bg-sage-50/60 p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <p className="text-xs font-medium text-sage-700">Hasil asesmen</p>
      </div>
      <AssessmentResultView content={content} />
    </div>
  );
}
