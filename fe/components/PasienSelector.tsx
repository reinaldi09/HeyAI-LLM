"use client";

import { useState, useRef, useEffect } from "react";
import { Search, UserPlus, X, ChevronDown, User } from "lucide-react";
import { FormField, inputClassName } from "@/components/ui/Page";
import { searchPasien, createPasien, type PasienSingkat, type PasienCreate, type JenisKelamin } from "@/lib/api";
import { cn } from "@/lib/utils";

interface PasienSelectorProps {
  value: PasienSingkat | null;
  onChange: (pasien: PasienSingkat | null) => void;
  disabled?: boolean;
}

function hitungUmur(tanggalLahir: string): number {
  const today = new Date();
  const lahir = new Date(tanggalLahir);
  let umur = today.getFullYear() - lahir.getFullYear();
  const m = today.getMonth() - lahir.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < lahir.getDate())) umur--;
  return umur;
}

// ── Form Pasien Baru ──────────────────────────────────────────────────────────

function FormPasienBaru({
  onSave,
  onCancel,
}: {
  onSave: (pasien: PasienSingkat) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<PasienCreate>({
    nama: "",
    jenis_kelamin: "laki-laki",
    tempat_lahir: "",
    tanggal_lahir: "",
    pekerjaan: "",
    no_hp: "",
    email: "",
    alamat: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof PasienCreate) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.nama.trim() || !form.tempat_lahir.trim() || !form.tanggal_lahir || !form.pekerjaan.trim() || !form.no_hp.trim() || !form.email.trim() || !form.alamat.trim()) {
      setError("Semua data pasien wajib diisi.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const payload: PasienCreate = {
        nama: form.nama.trim(),
        jenis_kelamin: form.jenis_kelamin,
        tempat_lahir: form.tempat_lahir.trim(),
        tanggal_lahir: form.tanggal_lahir,
        pekerjaan: form.pekerjaan.trim(),
        no_hp: form.no_hp.trim(),
        email: form.email.trim(),
        alamat: form.alamat.trim(),
      };
      const created = await createPasien(payload);
      onSave(created);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan pasien");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 rounded-2xl border border-white/70 bg-white/60 p-4 shadow-[0_16px_48px_rgba(31,52,85,0.08)] backdrop-blur-2xl">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-medium text-ink-800 flex items-center gap-2">
          <UserPlus size={14} className="text-sage-600" />
          Data Pasien Baru
        </h3>
        <button onClick={onCancel} className="text-ink-400 hover:text-ink-700 transition-colors">
          <X size={14} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Nama lengkap" className="sm:col-span-2">
          <input className={inputClassName} value={form.nama} onChange={set("nama")} />
        </FormField>

        <FormField label="Jenis kelamin">
          <select className={inputClassName} value={form.jenis_kelamin} onChange={set("jenis_kelamin")}>
            <option value="laki-laki">Laki-laki</option>
            <option value="perempuan">Perempuan</option>
          </select>
        </FormField>

        <FormField label="No. handphone">
          <input className={inputClassName} value={form.no_hp} onChange={set("no_hp")} />
        </FormField>

        <FormField label="Tempat lahir">
          <input className={inputClassName} value={form.tempat_lahir} onChange={set("tempat_lahir")} />
        </FormField>

        <FormField label="Tanggal lahir">
          <input type="date" className={inputClassName} value={form.tanggal_lahir} onChange={set("tanggal_lahir")} />
        </FormField>

        <FormField label="Pekerjaan" className="sm:col-span-2">
          <input className={inputClassName} value={form.pekerjaan} onChange={set("pekerjaan")} />
        </FormField>

        <FormField label="Email" className="sm:col-span-2">
          <input className={inputClassName} type="email" value={form.email} onChange={set("email")} />
        </FormField>

        <FormField label="Alamat" className="sm:col-span-2">
          <textarea className={inputClassName} rows={3} value={form.alamat} onChange={set("alamat")} />
        </FormField>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className={cn(
            "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
            loading
              ? "cursor-not-allowed border border-sage-100 bg-sage-50/80 text-sage-300"
              : "bg-gradient-to-r from-sage-800 via-sage-700 to-sage-600 text-white shadow-[0_14px_32px_rgba(31,82,146,0.20)] hover:from-sage-900 hover:via-sage-800 hover:to-sage-700"
          )}
        >
          {loading ? "Menyimpan..." : "Simpan Pasien"}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm text-ink-500 hover:bg-ink-100 transition-all"
        >
          Batal
        </button>
      </div>
    </div>
  );
}

// ── Komponen utama ────────────────────────────────────────────────────────────

export function PasienSelector({ value, onChange, disabled = false }: PasienSelectorProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PasienSingkat[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounce search
  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await searchPasien(query);
        setResults(data);
        setShowDropdown(true);
      } catch { /* ignore */ } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  const handleSelect = (p: PasienSingkat) => {
    onChange(p);
    setQuery("");
    setShowDropdown(false);
    setShowForm(false);
  };

  const handleClear = () => {
    if (disabled) return;
    onChange(null);
    setQuery("");
    setResults([]);
  };

  // ── Pasien sudah dipilih ──
  if (value) {
    return (
      <div className="flex items-center justify-between rounded-2xl border border-white/70 bg-white/65 px-4 py-3 shadow-[0_14px_40px_rgba(31,52,85,0.08)] backdrop-blur-2xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-sage-200 flex items-center justify-center flex-shrink-0">
            <User size={14} className="text-sage-700" />
          </div>
          <div>
            <p className="text-sm font-medium text-ink-800">{value.nama}</p>
            <p className="text-xs text-ink-400">
              {value.nomor_pasien} ·{" "}
              {value.jenis_kelamin === "laki-laki" ? "Laki-laki" : "Perempuan"} ·{" "}
              {hitungUmur(value.tanggal_lahir)} tahun
              {` · ${value.no_hp}`}
            </p>
            <p className="text-xs text-ink-400">{value.alamat}</p>
          </div>
        </div>
        <button
          onClick={handleClear}
          disabled={disabled}
          className="text-ink-400 hover:text-ink-700 transition-colors ml-2 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search input */}
      {!showForm && (
        <div ref={wrapperRef} className="relative">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
            <input
              value={query}
              disabled={disabled}
              onChange={(e) => { setQuery(e.target.value); setShowDropdown(true); }}
              onFocus={() => query && setShowDropdown(true)}
              placeholder="Cari nomor pasien, nama, no. handphone, pekerjaan, email, atau alamat..."
              className={cn(inputClassName, "pl-9 pr-10")}
            />
            {searching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-3.5 h-3.5 border-2 border-sage-300 border-t-sage-600 rounded-full animate-spin" />
              </div>
            )}
            {!searching && <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300" />}
          </div>

          {/* Dropdown hasil pencarian */}
          {showDropdown && results.length > 0 && (
            <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-white/70 bg-white/90 shadow-[0_18px_50px_rgba(31,52,85,0.16)] backdrop-blur-2xl">
              {results.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelect(p)}
                  disabled={disabled}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-sage-50 transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-full bg-ink-100 flex items-center justify-center flex-shrink-0">
                    <User size={12} className="text-ink-500" />
                  </div>
                  <div>
                    <p className="text-sm text-ink-800 font-medium">{p.nama}</p>
                    <p className="text-xs text-ink-400">
                      {p.nomor_pasien} · {hitungUmur(p.tanggal_lahir)} tahun · {p.jenis_kelamin}
                      {` · ${p.no_hp}`}
                      {` · ${p.email}`}
                      {` · ${p.alamat}`}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {showDropdown && query.length > 1 && results.length === 0 && !searching && (
            <div className="absolute z-20 mt-1 w-full bg-white rounded-xl border border-ink-200 shadow-lg px-4 py-3">
              <p className="text-xs text-ink-400">Pasien tidak ditemukan.</p>
            </div>
          )}
        </div>
      )}

      {/* Tombol buat pasien baru */}
      {!showForm && (
        <button
          disabled={disabled}
          onClick={() => { setShowForm(true); setShowDropdown(false); }}
          className="flex items-center gap-2 text-xs text-sage-700 hover:text-sage-900 px-1 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
        >
          <UserPlus size={13} />
          Daftarkan pasien baru
        </button>
      )}

      {/* Form pasien baru */}
      {showForm && (
        <FormPasienBaru
          onSave={handleSelect}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
