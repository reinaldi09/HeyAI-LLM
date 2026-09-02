"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Search, Trash2 } from "lucide-react";
import { AssessmentHistoryContent } from "@/components/AssessmentHistoryContent";
import { InfoField, inputClassName, PageBody, PageHeader, Panel } from "@/components/ui/Page";
import {
  deletePasien,
  deleteRekamMedis,
  getRekamMedisPasien,
  listPasien,
  type PasienSingkat,
  type RekamMedisResponse,
} from "@/lib/api";
import { formatAge, formatDate, formatDateTime, genderLabel } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const PATIENT_LIST_LIMIT = 1000;

function toggleExpandedRecord(ids: Set<string>, recordId: string) {
  const next = new Set(ids);
  if (next.has(recordId)) next.delete(recordId);
  else next.add(recordId);
  return next;
}

interface PatientsPageProps {
  canDelete?: boolean;
  showApoteker?: boolean;
  title?: string;
  description?: string;
}

export function PatientsPage({
  canDelete = false,
  showApoteker = false,
  title = "Pasien & riwayat klinis",
  description = "Lihat profil pasien, telusuri catatan asesmen, dan buka detail pemeriksaan tanpa kehilangan konteks.",
}: PatientsPageProps) {
  const [patients, setPatients] = useState<PasienSingkat[]>([]);
  const [selected, setSelected] = useState<PasienSingkat | null>(null);
  const [records, setRecords] = useState<RekamMedisResponse[]>([]);
  const [expandedRecordIds, setExpandedRecordIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  const loadPatients = async () => setPatients(await listPasien({ limit: PATIENT_LIST_LIMIT }));
  const loadRecords = async (patient: PasienSingkat) => setRecords(await getRekamMedisPasien(patient.id));

  useEffect(() => {
    loadPatients().catch((err) => setError(err.message));
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return patients.filter(
      (patient) =>
        patient.nomor_pasien.toLowerCase().includes(q) ||
        patient.nama.toLowerCase().includes(q) ||
        patient.pekerjaan.toLowerCase().includes(q) ||
        patient.no_hp?.toLowerCase().includes(q) ||
        patient.email?.toLowerCase().includes(q) ||
        patient.alamat?.toLowerCase().includes(q) ||
        patient.apoteker_nama?.toLowerCase().includes(q)
    );
  }, [patients, query]);

  const selectPatient = async (patient: PasienSingkat) => {
    setSelected(patient);
    setError("");
    setExpandedRecordIds(new Set());
    try {
      await loadRecords(patient);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat riwayat pasien");
    }
  };

  return (
    <>
      <PageHeader
        title={title}
        description={description}
      />
      <PageBody>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        <Panel className="p-4">
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
            <input
              className={cn(inputClassName, "pl-9")}
              placeholder={showApoteker ? "Cari pasien, kontak, pekerjaan, atau apoteker..." : "Cari pasien..."}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <div className="max-h-[620px] space-y-2 overflow-auto">
            {filtered.map((patient) => (
              <button
                key={patient.id}
                onClick={() => selectPatient(patient)}
                className={cn(
                  "w-full rounded-lg border px-3 py-2 text-left text-sm transition-all",
                  selected?.id === patient.id
                    ? "border-sage-300 bg-sage-50"
                    : "border-ink-100 hover:bg-ink-50"
                )}
              >
                <span className="font-medium text-ink-800">{patient.nama}</span>
                <span className="block text-xs text-ink-400">
                  {patient.nomor_pasien} - {genderLabel(patient.jenis_kelamin)} - {formatAge(patient.tanggal_lahir)}
                </span>
                <span className="block text-xs text-ink-400">{patient.pekerjaan}</span>
                {showApoteker && (
                  <span className="mt-1 block text-xs font-medium text-sage-700">
                    Apoteker: {patient.apoteker_nama || "Belum terhubung"}
                  </span>
                )}
              </button>
            ))}
          </div>
        </Panel>

        <Panel className="p-5">
          {!selected ? (
            <p className="text-sm text-ink-400">Pilih pasien untuk melihat riwayat keluhan dan pemeriksaan medis.</p>
          ) : (
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-3 border-b border-ink-100 pb-4">
                <div>
                  <h1 className="font-display text-2xl text-ink-900">{selected.nama}</h1>
                  <p className="text-sm text-ink-500">
                    {selected.nomor_pasien} - {genderLabel(selected.jenis_kelamin)} - {formatAge(selected.tanggal_lahir)}
                  </p>
                </div>
                {canDelete && (
                  <button
                    onClick={async () => {
                      await deletePasien(selected.id);
                      setSelected(null);
                      setRecords([]);
                      await loadPatients();
                    }}
                    className="group inline-flex items-center gap-2 rounded-xl border border-red-200/80 bg-gradient-to-r from-red-50 to-white px-3 py-2 text-xs font-medium text-red-600 shadow-sm hover:border-red-300 hover:from-red-100 hover:to-red-50 hover:text-red-700 hover:shadow-[0_12px_28px_rgba(220,38,38,0.12)]"
                    title="Hapus pasien"
                  >
                    <Trash2 size={15} className="transition-transform group-hover:-rotate-6" />
                    <span className="hidden sm:inline">Hapus</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 rounded-xl border border-ink-100 bg-ink-50/40 p-4 sm:grid-cols-2">
                <InfoField label="Nama" value={selected.nama} />
                <InfoField label="Nomor pasien" value={selected.nomor_pasien} />
                <InfoField label="Jenis kelamin" value={genderLabel(selected.jenis_kelamin)} />
                <InfoField label="Tempat, tanggal lahir" value={`${selected.tempat_lahir}, ${formatDate(selected.tanggal_lahir)}`} />
                <InfoField label="Umur" value={formatAge(selected.tanggal_lahir)} />
                <InfoField label="Pekerjaan" value={selected.pekerjaan} />
                <InfoField label="No. handphone" value={selected.no_hp || "-"} />
                <InfoField label="Email" value={<span className="break-all">{selected.email || "-"}</span>} />
                <InfoField label="Alamat" value={selected.alamat || "-"} />
                {showApoteker && (
                  <InfoField label="Apoteker" value={selected.apoteker_nama || "Belum terhubung"} />
                )}
                <InfoField label="Terdaftar sejak" value={formatDateTime(selected.created_at)} />
                <InfoField label="Diperbarui" value={formatDateTime(selected.updated_at)} />
              </div>

              {error && <p className="text-xs text-red-600">{error}</p>}
              <div className="space-y-3">
                {records.map((record) => (
                  <article key={record.id} className="rounded-xl border border-ink-100 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setExpandedRecordIds((ids) => toggleExpandedRecord(ids, record.id))}
                        className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-lg text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sage-200"
                      >
                        <span>
                          <span className="block text-sm font-medium text-ink-800">{record.nomor_rekam_medis}</span>
                          <span className="block text-xs text-ink-400">{formatDateTime(record.created_at)}</span>
                        </span>
                        {expandedRecordIds.has(record.id) ? (
                          <ChevronUp size={16} className="text-ink-400" />
                        ) : (
                          <ChevronDown size={16} className="text-ink-400" />
                        )}
                      </button>
                      {canDelete && (
                        <button
                          onClick={async () => {
                            await deleteRekamMedis(record.id);
                            await loadRecords(selected);
                          }}
                          className="text-red-500 hover:text-red-700"
                          title="Hapus riwayat"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    {expandedRecordIds.has(record.id) && (
                      <div className="mt-4 border-t border-ink-100 pt-4">
                        <p className="text-xs font-medium text-ink-500">Keluhan</p>
                        <p className="mb-3 whitespace-pre-wrap text-sm text-ink-800">{record.subjective}</p>
                        <p className="text-xs font-medium text-ink-500">Pemeriksaan medis</p>
                        <p className="whitespace-pre-wrap text-sm text-ink-800">{record.objective}</p>
                        {record.hasil_assessment && (
                          <AssessmentHistoryContent content={record.hasil_assessment} outputMode={record.output_mode} />
                        )}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </div>
          )}
        </Panel>
        </div>
      </PageBody>
    </>
  );
}
