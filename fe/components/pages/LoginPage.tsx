"use client";

import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { getCaptcha, login, type CaptchaResponse, type UserResponse } from "@/lib/api";
import { FormField, inputClassName } from "@/components/ui/Page";

export function LoginPage({
  onLoggedIn,
  onBack,
}: {
  onLoggedIn: (user: UserResponse) => void;
  onBack?: () => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState<CaptchaResponse | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadCaptcha = async () => {
    setCaptchaAnswer("");
    setCaptcha(await getCaptcha());
  };

  useEffect(() => {
    loadCaptcha().catch((err) =>
      setError(err instanceof Error ? err.message : "Gagal memuat captcha")
    );
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!captcha) return;
    setLoading(true);
    setError("");
    try {
      const result = await login(username, password, captcha.captcha_id, captchaAnswer);
      onLoggedIn(result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal");
      await loadCaptcha().catch(() => undefined);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-cream px-5 py-6 lg:grid lg:grid-cols-[1.18fr_0.82fr] lg:gap-6 lg:p-6">
      <section className="relative hidden overflow-hidden rounded-[32px] bg-[radial-gradient(circle_at_18%_14%,rgba(214,183,118,0.25),transparent_19rem),linear-gradient(150deg,#102449_0%,#173765_52%,#07111f_100%)] p-8 text-white shadow-[0_28px_90px_rgba(12,31,68,0.28)] lg:flex lg:flex-col lg:justify-between">
        <svg
          viewBox="0 0 760 520"
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-16 h-[330px] w-[480px] opacity-[0.16] drop-shadow-[0_12px_24px_rgba(0,0,0,0.10)]"
        >
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            <g stroke="#f7e9c7" strokeWidth="3" opacity="0.56">
              <path d="M95 95v84c0 58 39 96 91 96s91-38 91-96V95" />
              <path d="M95 95c0-20 32-20 32 0M245 95c0-20 32-20 32 0" />
              <path d="M186 275v52c0 44 35 80 79 80h37" />
              <circle cx="338" cy="407" r="37" />
              <path d="M520 86v92l-82 168c-19 39 10 84 53 84h116c43 0 72-45 53-84l-82-168V86" />
              <path d="M500 86h98M475 292h147M494 346h110" />
            </g>
            <g stroke="#ffffff" strokeWidth="2" opacity="0.42">
              <path d="M53 452c70-24 122-24 192 0s122 24 192 0 122-24 192 0" />
              <path d="M398 112h96M446 64v96M602 146h62M633 115v62" />
            </g>
          </g>
        </svg>
        <svg
          viewBox="0 0 760 520"
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-28 h-[300px] w-[440px] opacity-[0.12] drop-shadow-[0_10px_20px_rgba(0,0,0,0.08)]"
        >
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            <g stroke="#f7e9c7" strokeWidth="3" opacity="0.56">
              <path d="M475 88v76l-62 146c-15 36 11 76 50 76h88c39 0 65-40 50-76l-62-146V88" />
              <path d="M454 88h106M441 274h132M460 326h94" />
              <circle cx="491" cy="244" r="7" />
              <circle cx="535" cy="308" r="10" />
              <path d="M250 146v58l-42 112c-12 32 12 66 46 66h62c34 0 58-34 46-66l-42-112v-58" />
              <path d="M234 146h102M226 286h120" />
            </g>
            <g stroke="#ffffff" strokeWidth="2" opacity="0.42">
              <path d="M53 452c70-24 122-24 192 0s122 24 192 0 122-24 192 0" />
            </g>
          </g>
        </svg>
        <div className="relative z-10">
          <div className="inline-flex backdrop-blur-2xl py-3">
              <img src="/logo-white.png" alt="PharmaCare Logo" className="h-14 w-48 object-contain object-center" />
            </div>
          <div className="mt-16 max-w-xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs text-sage-100">
              <ShieldCheck size={14} />
              Platform klinis apotek yang lebih cerdas
            </p>
            <h1 className="font-display text-4xl leading-tight text-white">
              Kerja klinis lebih tenang, keputusan terasa lebih terarah.
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-7 text-sage-100/80">
              Kelola pasien, referensi, dan asesmen farmasi dalam ruang kerja yang aman, rapi, dan nyaman dipakai sepanjang hari.
            </p>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
            <p className="text-xl font-medium">Referensi Pintar</p>
            <p className="mt-1 text-xs text-sage-100/70">Konteks klinis siap pakai</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
            <p className="text-xl font-medium">Akses Aman</p>
            <p className="mt-1 text-xs text-sage-100/70">Sesi kerja terlindungi</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
            <p className="text-xl font-medium">Alur Stabil</p>
            <p className="mt-1 text-xs text-sage-100/70">Analisis tetap berjalan</p>
          </div>
        </div>
      </section>

      <section className="flex min-h-[calc(100vh-48px)] items-center justify-center rounded-[32px] border border-white/70 bg-white/55 p-6 shadow-[0_28px_90px_rgba(31,52,85,0.12)] backdrop-blur-2xl lg:min-h-0 lg:p-7">
        <form
          onSubmit={submit}
          className="w-full max-w-sm"
        >
          <img src="/logo.png" alt="PharmaCare Logo" className="mb-8 h-12 w-44 object-contain object-left lg:hidden" />
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-sage-600">Mulai ruang kerja klinis</p>
          <h2 className="font-display text-3xl text-ink-900">Selamat datang kembali</h2>
          <p className="mb-7 mt-2 text-sm leading-6 text-ink-500">
            Masuk dulu, lalu lanjutkan pekerjaan klinis dengan lebih fokus.
          </p>

          <div className="space-y-4">
            <FormField label="Nama pengguna">
              <input
                className={inputClassName}
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
              />
            </FormField>
            <FormField label="Kata sandi">
              <input
                className={inputClassName}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
            </FormField>

            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <label className="block text-xs font-medium text-ink-500">Captcha</label>
                <button
                  type="button"
                  onClick={loadCaptcha}
                  className="inline-flex items-center gap-1 text-xs text-sage-700 hover:text-sage-900"
                >
                  <RefreshCw size={12} />
                  Ganti
                </button>
              </div>
              <div className="grid grid-cols-[1fr_112px] gap-2">
                <div className="flex h-[72px] items-center justify-center overflow-hidden rounded-xl border border-sage-100 bg-ink-50">
                  {captcha ? (
                    <img
                      src={captcha.image_data_uri}
                      alt="Captcha"
                      className="h-full w-full object-cover"
                      draggable={false}
                    />
                  ) : (
                    <span className="text-sm text-ink-400">Memuat...</span>
                  )}
                </div>
                <FormField label="Kode">
                  <input
                    className={inputClassName}
                    autoComplete="off"
                    maxLength={8}
                    value={captchaAnswer}
                    onChange={(event) => setCaptchaAnswer(event.target.value.toUpperCase())}
                  />
                </FormField>
              </div>
            </div>

            {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
            <button
              disabled={loading || !captcha || !captchaAnswer.trim() || !username.trim() || !password}
              className="w-full rounded-xl bg-gradient-to-r from-sage-800 via-sage-700 to-sage-600 px-4 py-3 text-sm font-medium text-white shadow-[0_16px_36px_rgba(31,82,146,0.24)] transition-all hover:from-sage-900 hover:via-sage-800 hover:to-sage-700 disabled:border disabled:border-sage-100 disabled:bg-none disabled:bg-sage-50/80 disabled:text-sage-300 disabled:shadow-none"
            >
              {loading ? "Memeriksa..." : "Masuk"}
            </button>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="w-full rounded-xl px-4 py-2 text-sm font-medium text-ink-400 hover:bg-white/55 hover:text-sage-800"
              >
                Kembali ke beranda
              </button>
            )}
          </div>
        </form>
      </section>
    </main>
  );
}
