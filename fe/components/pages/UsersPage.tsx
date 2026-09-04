"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Search, Trash2, UserPlus, X } from "lucide-react";
import { AssessmentHistoryContent } from "@/components/AssessmentHistoryContent";
import { FormField, inputClassName, PageBody, PageHeader, Panel } from "@/components/ui/Page";
import {
  createUser,
  deleteUser,
  listPasienApoteker,
  listUsers,
  type JenisKelamin,
  type PasienDenganRekamMedis,
  type UserResponse,
  type UserRole,
} from "@/lib/api";
import { formatAge, formatDate, formatDateTime } from "@/lib/formatters";
import { cn } from "@/lib/utils";

function toggleExpandedRecord(ids: Set<string>, recordId: string) {
  const next = new Set(ids);
  if (next.has(recordId)) next.delete(recordId);
  else next.add(recordId);
  return next;
}

export function UsersPage() {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [selected, setSelected] = useState<UserResponse | null>(null);
  const [history, setHistory] = useState<PasienDenganRekamMedis[]>([]);
  const [expandedRecordIds, setExpandedRecordIds] = useState<Set<string>>(new Set());
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState({
    username: "",
    nama: "",
    password: "",
    role: "apoteker" as UserRole,
    jenis_kelamin: "laki-laki" as JenisKelamin,
    tempat_lahir: "",
    tanggal_lahir: "",
    no_hp: "",
    email: "",
    alamat: "",
    is_active: true,
  });
  const [error, setError] = useState("");

  const load = async (query = "") => {
    setLoadingUsers(true);
    try {
      const data = await listUsers({ role: "apoteker", q: query, limit: 50 });
      setUsers(data);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      load(searchQuery.trim()).catch((err) => setError(err.message));
    }, searchQuery.trim() ? 350 : 0);

    return () => window.clearTimeout(timeoutId);
  }, [searchQuery]);

  const selectApoteker = async (apoteker: UserResponse) => {
    setSelected(apoteker);
    setLoadingHistory(true);
    setError("");
    setExpandedRecordIds(new Set());
    try {
      setHistory(await listPasienApoteker(apoteker.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat riwayat pasien");
    } finally {
      setLoadingHistory(false);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    const username = form.username.trim();
    const nama = form.nama.trim();
    const password = form.password;
    const tempatLahir = form.tempat_lahir.trim();
    const noHp = form.no_hp.trim();
    const email = form.email.trim();
    const alamat = form.alamat.trim();

    if (username.length < 3) return setError("Nama pengguna minimal 3 karakter.");
    if (nama.length < 2) return setError("Nama apoteker minimal 2 karakter.");
    if (password.length < 8) return setError("Kata sandi minimal 8 karakter.");
    if (!form.jenis_kelamin || !tempatLahir || !form.tanggal_lahir || !noHp || !email || !alamat) {
      return setError("Semua data apoteker wajib diisi.");
    }

    try {
      await createUser({
        ...form,
        username,
        nama,
        password,
        role: "apoteker",
        tempat_lahir: tempatLahir,
        tanggal_lahir: form.tanggal_lahir,
        no_hp: noHp,
        email,
        alamat,
      });
      setForm({
        username: "",
        nama: "",
        password: "",
        role: "apoteker",
        jenis_kelamin: "laki-laki",
        tempat_lahir: "",
        tanggal_lahir: "",
        no_hp: "",
        email: "",
        alamat: "",
        is_active: true,
      });
      await load(searchQuery.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat apoteker");
    }
  };

  return (
    <>
      <PageHeader
        title="Tim apoteker"
        description="Tambahkan anggota tim, cek profilnya, dan lihat riwayat pasien yang pernah mereka asesmen."
      />
      <PageBody className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
        <section className="space-y-6">
        <Panel className="p-5">
          <form onSubmit={submit} className="space-y-4">
            <h1 className="font-display text-2xl text-ink-900">Tambah apoteker</h1>
            <FormField label="Nama pengguna">
              <input className={inputClassName} value={form.username} onChange={(event) => setForm((value) => ({ ...value, username: event.target.value }))} />
            </FormField>
            <FormField label="Nama apoteker">
              <input className={inputClassName} value={form.nama} onChange={(event) => setForm((value) => ({ ...value, nama: event.target.value }))} />
            </FormField>
            <FormField label="Kata sandi">
              <input className={inputClassName} type="password" placeholder="Minimal 8 karakter" value={form.password} onChange={(event) => setForm((value) => ({ ...value, password: event.target.value }))} />
            </FormField>
            <FormField label="Jenis kelamin">
              <select className={inputClassName} value={form.jenis_kelamin} onChange={(event) => setForm((value) => ({ ...value, jenis_kelamin: event.target.value as JenisKelamin }))}>
                <option value="laki-laki">Laki-laki</option>
                <option value="perempuan">Perempuan</option>
              </select>
            </FormField>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField label="Tempat lahir">
                <input className={inputClassName} value={form.tempat_lahir} onChange={(event) => setForm((value) => ({ ...value, tempat_lahir: event.target.value }))} />
              </FormField>
              <FormField label="Tanggal lahir">
                <input className={inputClassName} type="date" value={form.tanggal_lahir} onChange={(event) => setForm((value) => ({ ...value, tanggal_lahir: event.target.value }))} />
              </FormField>
            </div>
            <FormField label="No. handphone">
              <input className={inputClassName} value={form.no_hp} onChange={(event) => setForm((value) => ({ ...value, no_hp: event.target.value }))} />
            </FormField>
            <FormField label="Email">
              <input className={inputClassName} type="email" value={form.email} onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))} />
            </FormField>
            <FormField label="Alamat">
              <textarea className={inputClassName} rows={3} value={form.alamat} onChange={(event) => setForm((value) => ({ ...value, alamat: event.target.value }))} />
            </FormField>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sage-800 via-sage-700 to-sage-600 px-4 py-2.5 text-sm font-medium text-white shadow-[0_14px_32px_rgba(31,82,146,0.22)] hover:from-sage-900 hover:via-sage-800 hover:to-sage-700">
              <UserPlus size={14} />
              Simpan apoteker
            </button>
          </form>
        </Panel>

        {selected && (
          <Panel className="p-5">
            <h2 className="mb-3 text-sm font-medium text-ink-800">Informasi apoteker</h2>
            <div className="space-y-2 text-sm">
              <p className="font-medium text-ink-900">{selected.nama}</p>
              <p className="text-ink-500">@{selected.username} - {selected.is_active ? "aktif" : "nonaktif"}</p>
              <p className="text-ink-500">
                {selected.jenis_kelamin || "-"} - {selected.tempat_lahir || "-"}
                {selected.tanggal_lahir ? `, ${formatDate(selected.tanggal_lahir)}` : ""}
              </p>
              <p className="text-ink-500">{selected.no_hp || "No. HP belum diisi"}</p>
              <p className="text-ink-500">{selected.email || "Email belum diisi"}</p>
              <p className="text-ink-500">{selected.alamat || "Alamat belum diisi"}</p>
            </div>
          </Panel>
        )}
      </section>

      <Panel className="p-5">
        <h2 className="mb-4 text-sm font-medium text-ink-800">Apoteker terdaftar</h2>
        <div className="relative mb-4">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-300" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Cari nama, username, no. handphone, email, alamat, atau status..."
            className={cn(inputClassName, "pl-11 pr-11")}
          />
          {loadingUsers && (
            <div className="absolute right-10 top-1/2 -translate-y-1/2">
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-sage-200 border-t-sage-600" />
            </div>
          )}
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 rounded-full p-1 text-ink-300 transition-colors hover:bg-ink-100 hover:text-ink-600"
              title="Bersihkan pencarian"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className="space-y-3">
          {users.map((user) => (
            <article
              key={user.id}
              onClick={() => selectApoteker(user)}
              className={cn(
                "flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-all",
                selected?.id === user.id ? "border-sage-300 bg-sage-50" : "border-ink-100 hover:bg-ink-50"
              )}
            >
              <div>
                <h3 className="font-medium text-ink-800">{user.nama}</h3>
                <p className="text-xs text-ink-400">{user.username} - {user.is_active ? "aktif" : "nonaktif"}</p>
              </div>
              <button
                onClick={async (event) => {
                  event.stopPropagation();
                  await deleteUser(user.id);
                  if (selected?.id === user.id) {
                    setSelected(null);
                    setHistory([]);
                  }
                  await load(searchQuery.trim());
                }}
                className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                title="Hapus apoteker"
              >
                <Trash2 size={15} />
              </button>
            </article>
          ))}
          {!loadingUsers && users.length === 0 && (
            <div className="rounded-2xl border border-dashed border-ink-200 bg-white/50 px-4 py-6 text-center">
              <p className="text-sm text-ink-400">
                {searchQuery.trim() ? "Apoteker tidak ditemukan." : "Belum ada apoteker terdaftar."}
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 rounded-xl border border-ink-100 p-4">
          {!selected ? (
            <p className="text-sm text-ink-400">Klik apoteker untuk melihat riwayat pasien asesmen.</p>
          ) : loadingHistory ? (
            <p className="text-sm text-ink-400">Memuat riwayat pasien...</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-ink-400">Belum ada pasien asesmen untuk apoteker ini.</p>
          ) : (
            <div className="space-y-4">
              {history.map((patient) => (
                <article key={patient.id} className="rounded-xl border border-ink-100 p-4">
                  <div className="mb-3">
                    <h3 className="font-medium text-ink-800">{patient.nama}</h3>
                    <p className="text-xs text-ink-400">{patient.nomor_pasien} - {patient.pekerjaan}</p>
                    <p className="text-xs text-ink-400">{patient.jenis_kelamin} - {formatAge(patient.tanggal_lahir)}</p>
                    <p className="text-xs text-ink-400">{patient.no_hp || "No. HP belum diisi"} - {patient.email || "Email belum diisi"}</p>
                    <p className="text-xs text-ink-400">{patient.alamat || "Alamat belum diisi"}</p>
                  </div>
                  <div className="space-y-3">
                    {patient.rekam_medis.length === 0 ? (
                      <p className="text-xs text-ink-400">Belum ada riwayat keluhan atau pemeriksaan.</p>
                    ) : (
                      patient.rekam_medis.map((record) => (
                        <div key={record.id} className="rounded-lg bg-ink-50 p-3">
                          <button
                            type="button"
                            onClick={() => setExpandedRecordIds((ids) => toggleExpandedRecord(ids, record.id))}
                            className="flex w-full items-center justify-between gap-3 text-left"
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
                          {expandedRecordIds.has(record.id) && (
                            <div className="mt-3 border-t border-ink-100 pt-3">
                              <p className="text-xs font-medium text-ink-500">Keluhan</p>
                              <p className="mb-2 whitespace-pre-wrap text-sm text-ink-800">{record.subjective}</p>
                              <p className="text-xs font-medium text-ink-500">Pemeriksaan medis</p>
                              <p className="whitespace-pre-wrap text-sm text-ink-800">{record.objective}</p>
                              {record.hasil_assessment && (
                                <AssessmentHistoryContent content={record.hasil_assessment} />
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
        </Panel>
      </PageBody>
    </>
  );
}
