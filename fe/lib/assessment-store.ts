"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  createAssessmentJob,
  getAssessmentJob,
  type AssessmentJobResponse,
  type OutputMode,
  type PasienSingkat,
  type PharmaResponse,
} from "@/lib/api";

interface AssessmentState {
  jobId: string | null;
  pasien: PasienSingkat | null;
  simpan: boolean;
  subjective: string;
  objective: string;
  outputMode: OutputMode;
  isLoading: boolean;
  result: PharmaResponse | null;
  error: string | null;
}

type AssessmentPatch = Partial<AssessmentState>;

const initialState: AssessmentState = {
  jobId: null,
  pasien: null,
  simpan: true,
  subjective: "",
  objective: "",
  outputMode: "summary",
  isLoading: false,
  result: null,
  error: null,
};

let state: AssessmentState = initialState;
let inFlight: Promise<void> | null = null;
let pollTimer: ReturnType<typeof setTimeout> | null = null;
let hydrated = false;
const listeners = new Set<() => void>();
const STORAGE_KEY = "pharma-assessment-job-id";

function emit() {
  listeners.forEach((listener) => listener());
}

function setAssessmentState(patch: AssessmentPatch) {
  state = { ...state, ...patch };
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

export function useAssessmentState() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    hydrateAssessmentJob();
  }, []);

  return snapshot;
}

export function updateAssessmentState(patch: AssessmentPatch) {
  const changesAssessmentInput =
    "pasien" in patch ||
    "subjective" in patch ||
    "objective" in patch ||
    "outputMode" in patch ||
    "simpan" in patch;

  if (changesAssessmentInput && !state.isLoading && !("jobId" in patch)) {
    clearStoredJobId();
    setAssessmentState({ ...patch, jobId: null });
    return;
  }

  setAssessmentState(patch);
}

export function resetAssessmentResult() {
  clearStoredJobId();
  setAssessmentState({
    jobId: null,
    isLoading: false,
    result: null,
    error: null,
    subjective: "",
    objective: "",
  });
}

function storeJobId(jobId: string) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, jobId);
  }
}

function clearStoredJobId() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

function mapJobToResult(job: AssessmentJobResponse): PharmaResponse | null {
  if (job.status !== "completed" || !job.result) return null;
  return {
    output_mode: job.output_mode,
    result: job.result,
    rekam_medis_id: job.rekam_medis_id || undefined,
    nomor_rekam_medis: job.nomor_rekam_medis,
  };
}

function applyJobState(job: AssessmentJobResponse) {
  const isActive = job.status === "pending" || job.status === "running";
  const isFailed = job.status === "failed";

  setAssessmentState({
    jobId: job.id,
    pasien: job.pasien,
    simpan: job.simpan,
    subjective: job.subjective,
    objective: job.objective,
    outputMode: job.output_mode,
    isLoading: isActive,
    result: mapJobToResult(job),
    error: isFailed ? job.error_message || "Asesmen gagal diproses" : null,
  });

  if (isActive) {
    schedulePoll(job.id);
  }
}

function schedulePoll(jobId: string, delay = 1500) {
  if (pollTimer) clearTimeout(pollTimer);
  pollTimer = setTimeout(() => {
    pollAssessmentJob(jobId);
  }, delay);
}

async function pollAssessmentJob(jobId: string) {
  try {
    const job = await getAssessmentJob(jobId);
    if (state.jobId !== jobId) return;
    applyJobState(job);
  } catch {
    if (state.jobId === jobId && state.isLoading) {
      schedulePoll(jobId, 5000);
    }
  }
}

function hydrateAssessmentJob() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;

  const jobId = window.localStorage.getItem(STORAGE_KEY);
  if (!jobId || state.jobId) return;

  setAssessmentState({ jobId, isLoading: true, error: null });
  pollAssessmentJob(jobId);
}

export function startAssessment() {
  if (inFlight || state.isLoading || !state.pasien) return;

  const payload = {
    pasien_id: state.pasien.id,
    subjective: state.subjective.trim(),
    objective: state.objective.trim(),
    output_mode: state.outputMode,
    simpan: state.simpan,
  };

  setAssessmentState({ isLoading: true, error: null, result: null });

  inFlight = createAssessmentJob(payload)
    .then((job) => {
      storeJobId(job.id);
      applyJobState(job);
    })
    .catch((err) => {
      setAssessmentState({
        isLoading: false,
        error: err instanceof Error ? err.message : "Terjadi kesalahan",
      });
    })
    .finally(() => {
      inFlight = null;
    });
}
