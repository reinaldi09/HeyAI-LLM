"use client";

import { FlaskConical, Save, UserRound, Zap } from "lucide-react";
import { ErrorAlert } from "@/components/ErrorAlert";
import { LoadingIndicator } from "@/components/LoadingIndicator";
import { PasienSelector } from "@/components/PasienSelector";
import { ResultPanel } from "@/components/ResultPanel";
import { TextArea } from "@/components/TextArea";
import {
  resetAssessmentResult,
  startAssessment,
  updateAssessmentState,
  useAssessmentState,
} from "@/lib/assessment-store";
import { cn } from "@/lib/utils";

const EXAMPLE_CASES = [
  {
    label: "DM Tipe 2 - Hipoglikemia",
    subjective:
      "DM tipe 2 sejak 10 tahun, mengeluh sering pusing, gemetar, dan berkeringat dingin terutama pagi hari sebelum makan. Rutin minum glibenklamid 5 mg/hari dan metformin 500 mg 2x/hari.",
    objective:
      "GDS: 68 mg/dL. HbA1c: 6,1%. BB: 58 kg, TB: 165 cm. TD: 130/80 mmHg. Kreatinin 1,2 mg/dL, eGFR 58.",
  },
  {
    label: "DM Tipe 2 - Kontrol Buruk",
    subjective:
      "DM tipe 2, mengeluh badan lemas dan sering haus. Menggunakan metformin 500 mg 2x/hari selama 2 tahun namun belum pernah kontrol teratur.",
    objective:
      "HbA1c: 10,2%. GDS: 320 mg/dL. BB: 72 kg, TB: 158 cm. TD: 140/90 mmHg. Kolesterol total: 220 mg/dL.",
  },
];

export function AssessmentForm() {
  const { pasien, simpan, subjective, objective, isLoading, result, error } = useAssessmentState();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!pasien || !subjective.trim() || !objective.trim()) return;
    startAssessment();
  };

  const hasValidInput = Boolean(subjective.trim()) && Boolean(objective.trim());
  const canAnalyze = Boolean(pasien) && hasValidInput;

  if (result) {
    return <ResultPanel result={result} pasien={pasien} onReset={resetAssessmentResult} />;
  }

  return (
    <div>
      <div className="mb-6">
        <p className="mb-2 text-xs text-ink-400">Contoh kasus:</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_CASES.map((example) => (
            <button
              key={example.label}
              type="button"
              disabled={isLoading}
              onClick={() =>
                updateAssessmentState({
                  subjective: example.subjective,
                  objective: example.objective,
                  result: null,
                  error: null,
                })
              }
              className="rounded-full border border-ink-200 px-3 py-1.5 text-xs text-ink-600 transition-all duration-150 hover:border-sage-300 hover:bg-sage-50 hover:text-sage-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {example.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-ink-800">Pasien</label>
          <PasienSelector
            value={pasien}
            onChange={(nextPasien) => updateAssessmentState({ pasien: nextPasien, result: null, error: null })}
            disabled={isLoading}
          />
          {pasien && (
            <label className="group mt-3 flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={simpan}
                disabled={isLoading}
                onChange={(event) => updateAssessmentState({ simpan: event.target.checked })}
                className="h-4 w-4 cursor-pointer rounded border-ink-300 text-sage-600 focus:ring-sage-400"
              />
              <span className="flex items-center gap-1.5 text-xs text-ink-500 transition-colors group-hover:text-ink-700">
                <Save size={11} />
                Simpan hasil ke rekam medis pasien ini
              </span>
            </label>
          )}
        </div>

        <div className="border-t border-ink-100" />

        <TextArea
          label="Data subjektif (S)"
          sublabel="Keluhan, riwayat penyakit, dan obat yang digunakan"
          icon={<UserRound size={15} />}
          value={subjective}
          onChange={(event) => updateAssessmentState({ subjective: event.target.value, result: null, error: null })}
          placeholder="Contoh: DM tipe 2, mengeluh..."
          rows={5}
          disabled={isLoading}
        />

        <TextArea
          label="Data objektif (O)"
          sublabel="Data laboratorium, tanda vital, dan pemeriksaan klinis"
          icon={<FlaskConical size={15} />}
          value={objective}
          onChange={(event) => updateAssessmentState({ objective: event.target.value, result: null, error: null })}
          placeholder="Contoh: HbA1c: 9,2%, GDS: 280 mg/dL, TD: 140/90 mmHg..."
          rows={4}
          disabled={isLoading}
        />

        {error && <ErrorAlert message={error} onDismiss={() => updateAssessmentState({ error: null })} />}
        {isLoading && <LoadingIndicator />}

        {!isLoading && (
          <button
            type="submit"
            disabled={!canAnalyze}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-medium transition-all duration-200",
              canAnalyze
                ? "bg-gradient-to-r from-sage-800 via-sage-700 to-sage-600 text-white shadow-[0_16px_36px_rgba(31,82,146,0.24)] hover:from-sage-900 hover:via-sage-800 hover:to-sage-700 hover:shadow-[0_18px_42px_rgba(31,82,146,0.30)] active:scale-[0.99]"
                : "cursor-not-allowed border border-sage-100 bg-sage-50/80 text-sage-300"
            )}
          >
            <Zap size={15} />
            Mulai asesmen
            {pasien && simpan && <span className="ml-1 text-xs text-sage-300">- akan disimpan</span>}
          </button>
        )}

        {!canAnalyze && !isLoading && (
          <p className="text-center text-xs text-ink-400">
            Pilih pasien, isi data klinisnya, lalu mulai asesmen.
          </p>
        )}
      </form>
    </div>
  );
}
