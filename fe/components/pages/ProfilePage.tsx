"use client";

import { useState } from "react";
import { Save, ShieldCheck } from "lucide-react";
import { FormField, InfoField, inputClassName, PageBody, PageHeader, Panel } from "@/components/ui/Page";
import { updateMe, type JenisKelamin, type UserResponse, type UserSelfUpdate } from "@/lib/api";
import { formatDateTime, genderLabel } from "@/lib/formatters";
import { cn } from "@/lib/utils";

type ProfileForm = {
  nama: string;
  jenis_kelamin: JenisKelamin;
  tempat_lahir: string;
  tanggal_lahir: string;
  no_hp: string;
  email: string;
  alamat: string;
  password: string;
};

function initialForm(user: UserResponse): ProfileForm {
  return {
    nama: user.nama || "",
    jenis_kelamin: (user.jenis_kelamin || "laki-laki") as JenisKelamin,
    tempat_lahir: user.tempat_lahir || "",
    tanggal_lahir: user.tanggal_lahir || "",
    no_hp: user.no_hp || "",
    email: user.email || "",
    alamat: user.alamat || "",
    password: "",
  };
}

export function ProfilePage({
  user,
  onUserUpdated,
}: {
  user: UserResponse;
  onUserUpdated: (user: UserResponse) => void;
}) {
  const [form, setForm] = useState<ProfileForm>(() => initialForm(user));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const setField = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const payload: UserSelfUpdate = {
      nama: form.nama,
      jenis_kelamin: form.jenis_kelamin,
      tempat_lahir: form.tempat_lahir,
      tanggal_lahir: form.tanggal_lahir,
      no_hp: form.no_hp,
      email: form.email,
      alamat: form.alamat,
    };

    if (form.password.trim()) {
      payload.password = form.password;
    }

    try {
      const updated = await updateMe(payload);
      onUserUpdated(updated);
      setForm((current) => ({ ...current, password: "" }));
      setMessage("Profil berhasil diperbarui.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui profil");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Profil apoteker"
        description="Perbarui data diri dan kata sandi agar akun tetap akurat, aman, dan siap dipakai di setiap sesi kerja."
      />
      <PageBody>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <Panel className="p-6">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-sage-100 bg-sage-50 px-3 py-1.5 text-xs font-medium text-sage-700">
              <ShieldCheck size={14} />
              Akun aktif
            </span>
            <h2 className="font-display text-3xl text-ink-900">{user.nama}</h2>
            <p className="mt-2 text-sm text-ink-500">@{user.username}</p>

            <div className="mt-8 grid gap-3 rounded-2xl border border-white/70 bg-porcelain/70 p-4">
              <InfoField label="Peran" value={user.role === "superadmin" ? "Superadmin" : "Apoteker"} />
              <InfoField label="Jenis kelamin" value={user.jenis_kelamin ? genderLabel(user.jenis_kelamin) : "-"} />
              <InfoField label="Alamat" value={user.alamat || "-"} />
              <InfoField label="Bergabung" value={formatDateTime(user.created_at)} />
              <InfoField label="Terakhir diperbarui" value={formatDateTime(user.updated_at)} />
            </div>
          </Panel>

          <Panel className="p-6">
            <form onSubmit={submit} className="space-y-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-sage-600">
                  Data diri
                </p>
                <h3 className="mt-2 font-display text-2xl text-ink-900">Informasi apoteker</h3>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Nama lengkap" className="sm:col-span-2">
                  <input className={inputClassName} value={form.nama} onChange={(e) => setField("nama", e.target.value)} />
                </FormField>
                <FormField label="Jenis kelamin">
                  <select
                    className={inputClassName}
                    value={form.jenis_kelamin}
                    onChange={(e) => setField("jenis_kelamin", e.target.value as JenisKelamin)}
                  >
                    <option value="laki-laki">Laki-laki</option>
                    <option value="perempuan">Perempuan</option>
                  </select>
                </FormField>
                <FormField label="Tempat lahir">
                  <input className={inputClassName} value={form.tempat_lahir} onChange={(e) => setField("tempat_lahir", e.target.value)} />
                </FormField>
                <FormField label="Tanggal lahir">
                  <input className={inputClassName} type="date" value={form.tanggal_lahir} onChange={(e) => setField("tanggal_lahir", e.target.value)} />
                </FormField>
                <FormField label="No. handphone">
                  <input className={inputClassName} value={form.no_hp} onChange={(e) => setField("no_hp", e.target.value)} />
                </FormField>
                <FormField label="Email" className="sm:col-span-2">
                  <input className={inputClassName} type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} />
                </FormField>
                <FormField label="Alamat" className="sm:col-span-2">
                  <textarea className={inputClassName} rows={3} value={form.alamat} onChange={(e) => setField("alamat", e.target.value)} />
                </FormField>
                <FormField label="Kata sandi baru" className="sm:col-span-2">
                  <input
                    className={inputClassName}
                    type="password"
                    value={form.password}
                    onChange={(e) => setField("password", e.target.value)}
                    placeholder="Kosongkan jika tidak ingin mengganti"
                    autoComplete="new-password"
                  />
                </FormField>
              </div>

              {message && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{message}</p>}
              {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={saving}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sage-800 via-sage-700 to-sage-600 px-5 py-3 text-sm font-medium text-white shadow-[0_16px_36px_rgba(31,82,146,0.24)] hover:from-sage-900 hover:via-sage-800 hover:to-sage-700",
                  "disabled:border disabled:border-sage-100 disabled:bg-none disabled:bg-sage-50/80 disabled:text-sage-300 disabled:shadow-none"
                )}
              >
                <Save size={16} />
                {saving ? "Menyimpan..." : "Simpan perubahan"}
              </button>
            </form>
          </Panel>
        </div>
      </PageBody>
    </>
  );
}
