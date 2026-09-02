import type { JenisKelamin } from "@/lib/api";

export function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID");
}

export function formatDateTime(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("id-ID");
}

export function formatAge(tanggalLahir: string) {
  const today = new Date();
  const birthDate = new Date(tanggalLahir);
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();

  if (today.getDate() < birthDate.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return `${Math.max(years, 0)} tahun ${Math.max(months, 0)} bulan`;
}

export function genderLabel(value: JenisKelamin | string) {
  return value === "laki-laki" ? "Laki-laki" : "Perempuan";
}
