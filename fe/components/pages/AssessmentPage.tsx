"use client";

import { AssessmentForm } from "@/components/AssessmentForm";
import { PageBody, PageHeader, Panel } from "@/components/ui/Page";

export function AssessmentPage() {
  return (
    <>
      <PageHeader
        title="Mulai asesmen farmasi"
        description="Isi data klinis pasien, lalu biarkan PharmaCare menyusun analisis berbasis referensi dengan alur yang tetap rapi."
      />
      <PageBody>
        <Panel className="p-6">
          <AssessmentForm />
        </Panel>
      </PageBody>
    </>
  );
}
