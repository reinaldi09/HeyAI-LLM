export type OutputMode = "summary" | "expanded";
export type JenisKelamin = "laki-laki" | "perempuan";
export type UserRole = "superadmin" | "apoteker";
export type EntityId = string;

const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX || "/api";

// Pasien

export interface PasienCreate {
  nama: string;
  jenis_kelamin: JenisKelamin;
  tempat_lahir: string;
  tanggal_lahir: string; // format: YYYY-MM-DD
  pekerjaan: string;
  no_hp: string;
  email: string;
  alamat: string;
}

export type PasienUpdate = Partial<PasienCreate>;

export interface PasienSingkat {
  id: EntityId;
  nama: string;
  nomor_pasien: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  jenis_kelamin: JenisKelamin;
  pekerjaan: string;
  no_hp: string;
  email: string;
  alamat: string;
  apoteker_id?: EntityId | null;
  apoteker_nama?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PasienResponse extends PasienSingkat {
  created_at: string;
  updated_at: string;
}

// Rekam Medis
export interface RekamMedisResponse {
  id: EntityId;
  pasien_id: EntityId;
  nomor_rekam_medis: string;
  subjective: string;
  objective: string;
  output_mode: OutputMode;
  hasil_assessment: string | null;
  created_at: string;
  updated_at: string;
}

export interface RekamMedisCreate {
  pasien_id: EntityId;
  subjective: string;
  objective: string;
  output_mode: OutputMode;
}

// Asesmen
export interface PharmaRequest {
  pasien_id: EntityId;
  subjective: string;
  objective: string;
  output_mode: OutputMode;
  simpan: boolean;
}

export interface PharmaResponse {
  output_mode: OutputMode;
  result: string;
  rekam_medis_id?: EntityId;
  nomor_rekam_medis?: string | null;
}

export type AssessmentJobStatus = "pending" | "running" | "completed" | "failed";

export interface AssessmentJobResponse {
  id: EntityId;
  apoteker_id: EntityId;
  pasien_id: EntityId;
  pasien: PasienSingkat;
  rekam_medis_id: EntityId | null;
  nomor_rekam_medis: string | null;
  subjective: string;
  objective: string;
  output_mode: OutputMode;
  simpan: boolean;
  status: AssessmentJobStatus;
  result: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiError {
  detail: unknown;
}

export interface UserResponse {
  id: EntityId;
  username: string;
  nama: string;
  role: UserRole;
  jenis_kelamin?: JenisKelamin | null;
  tempat_lahir?: string | null;
  tanggal_lahir?: string | null;
  no_hp?: string | null;
  email?: string | null;
  alamat?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserCreate {
  username: string;
  nama: string;
  password: string;
  role: UserRole;
  jenis_kelamin: JenisKelamin;
  tempat_lahir: string;
  tanggal_lahir: string;
  no_hp: string;
  email: string;
  alamat: string;
  is_active: boolean;
}

export type UserSelfUpdate = Partial<
  Pick<
    UserCreate,
    "nama" | "password" | "jenis_kelamin" | "tempat_lahir" | "tanggal_lahir" | "no_hp" | "email" | "alamat"
  >
>;

export interface PasienDenganRekamMedis extends PasienResponse {
  rekam_medis: RekamMedisResponse[];
}

export interface LoginResponse {
  user: UserResponse;
}

export interface CaptchaResponse {
  captcha_id: string;
  image_data_uri: string;
  expires_in_seconds: number;
}

export interface PdfDocumentResponse {
  id: EntityId;
  title: string;
  filename: string;
  original_filename: string;
  file_size: number;
  description: string;
  uploaded_by_id: EntityId | null;
  created_at: string;
  updated_at: string;
}

// Helpers
function formatApiErrorDetail(detail: unknown, fallbackMessage: string): string {
  if (!detail) return fallbackMessage;
  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const record = item as { loc?: unknown[]; msg?: unknown; message?: unknown };
          const location = Array.isArray(record.loc) ? record.loc.join(".") : "";
          const message = record.msg || record.message || JSON.stringify(item);
          return location ? `${location}: ${message}` : String(message);
        }
        return String(item);
      })
      .join("; ");
  }

  if (typeof detail === "object") {
    return JSON.stringify(detail);
  }

  return String(detail);
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);

  if (!headers.has("Content-Type") && !(init?.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_PREFIX}${path}`, {
    ...init,
    headers,
    credentials: "same-origin",
  });

  const contentType = res.headers.get("content-type") || "";
  const responseText = await res.text();

  if (!res.ok) {
    const fallbackMessage = `Error ${res.status}`;

    if (contentType.includes("application/json") && responseText) {
      const err = JSON.parse(responseText) as ApiError;
      throw new Error(formatApiErrorDetail(err.detail, fallbackMessage));
    }

    if (res.status === 504) {
      throw new Error("Asesmen membutuhkan waktu terlalu lama. Coba lagi, atau kurangi panjang data subjektif/objektif.");
    }

    throw new Error(responseText || fallbackMessage);
  }

  if (!responseText) {
    return undefined as T;
  }

  return JSON.parse(responseText) as T;
}

// API functions
export const createPasien = (data: PasienCreate) =>
  apiFetch<PasienResponse>("/pasien", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const listPasien = (params: { skip?: number; limit?: number } = {}) => {
  const search = new URLSearchParams();
  if (params.skip !== undefined) search.set("skip", String(params.skip));
  if (params.limit !== undefined) search.set("limit", String(params.limit));
  const query = search.toString();
  return apiFetch<PasienSingkat[]>(`/pasien${query ? `?${query}` : ""}`);
};

export const updatePasien = (id: EntityId, data: PasienUpdate) =>
  apiFetch<PasienResponse>(`/pasien/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deletePasien = (id: EntityId) =>
  apiFetch<{ detail: string }>(`/pasien/${id}`, { method: "DELETE" });

export const searchPasien = (q: string) =>
  apiFetch<PasienSingkat[]>(`/pasien/search?q=${encodeURIComponent(q)}`);

export const getRekamMedisPasien = (pasienId: EntityId) =>
  apiFetch<RekamMedisResponse[]>(`/pasien/${pasienId}/rekam-medis`);

export const createRekamMedis = (payload: RekamMedisCreate) =>
  apiFetch<RekamMedisResponse>("/rekam-medis", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateRekamMedis = (id: EntityId, payload: Partial<RekamMedisCreate>) =>
  apiFetch<RekamMedisResponse>(`/rekam-medis/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const deleteRekamMedis = (id: EntityId) =>
  apiFetch<{ detail: string }>(`/rekam-medis/${id}`, { method: "DELETE" });

export const submitPharmaAssessment = (payload: PharmaRequest) =>
  apiFetch<PharmaResponse>("/pharma-assessment", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const createAssessmentJob = (payload: PharmaRequest) =>
  apiFetch<AssessmentJobResponse>("/assessment-jobs", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const getAssessmentJob = (id: EntityId) =>
  apiFetch<AssessmentJobResponse>(`/assessment-jobs/${id}`);

export const login = (
  username: string,
  password: string,
  captchaId: string,
  captchaAnswer: string
) =>
  apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      username,
      password,
      captcha_id: captchaId,
      captcha_answer: captchaAnswer,
    }),
  });

export const getCaptcha = () => apiFetch<CaptchaResponse>("/auth/captcha");

export const me = () => apiFetch<UserResponse>("/auth/me");

export const updateMe = (payload: UserSelfUpdate) =>
  apiFetch<UserResponse>("/auth/me", {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const logout = () =>
  apiFetch<{ detail: string }>("/auth/logout", {
    method: "POST",
  });

export const listUsers = (params: { role?: UserRole; q?: string; limit?: number } = {}) => {
  const search = new URLSearchParams();
  if (params.role) search.set("role", params.role);
  if (params.q?.trim()) search.set("q", params.q.trim());
  if (params.limit) search.set("limit", String(params.limit));
  const query = search.toString();
  return apiFetch<UserResponse[]>(`/users${query ? `?${query}` : ""}`);
};

export const listPasienApoteker = (userId: EntityId) =>
  apiFetch<PasienDenganRekamMedis[]>(`/users/${userId}/pasien`);

export const createUser = (payload: UserCreate) =>
  apiFetch<UserResponse>("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateUser = (id: EntityId, payload: Partial<UserCreate>) =>
  apiFetch<UserResponse>(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const deleteUser = (id: EntityId) =>
  apiFetch<{ detail: string }>(`/users/${id}`, { method: "DELETE" });

export const listDocuments = () => apiFetch<PdfDocumentResponse[]>("/documents");

export const createDocument = (form: FormData) =>
  apiFetch<PdfDocumentResponse>("/documents", { method: "POST", body: form });

export const updateDocument = (id: EntityId, form: FormData) =>
  apiFetch<PdfDocumentResponse>(`/documents/${id}`, { method: "PUT", body: form });

export const deleteDocument = (id: EntityId) =>
  apiFetch<{ detail: string }>(`/documents/${id}`, { method: "DELETE" });
