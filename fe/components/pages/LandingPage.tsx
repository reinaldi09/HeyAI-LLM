"use client";

import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  ClipboardCheck,
  FileText,
  LockKeyhole,
  Sparkles,
  UsersRound,
} from "lucide-react";

const benefits = [
  {
    icon: ClipboardCheck,
    title: "Asesmen Lebih Mantap",
    description:
      "Ubah data pasien, keluhan, dan pemeriksaan menjadi telaah farmasi yang lebih rapi, konsisten, dan siap dibahas.",
  },
  {
    icon: BookOpenCheck,
    title: "Referensi Siap Pakai",
    description:
      "Panduan klinis dan dokumen internal bisa dikelola sebagai basis pengetahuan yang mendukung pekerjaan apoteker.",
  },
  {
    icon: LockKeyhole,
    title: "Ruang Kerja Terlindungi",
    description:
      "Akses berbasis peran, sesi aman, dan riwayat pasien membantu tim bekerja lebih tenang dari hari ke hari.",
  },
];

const metrics = [
  { value: "01", label: "Ruang pasien terstruktur" },
  { value: "02", label: "Referensi klinis terkendali" },
  { value: "03", label: "Riwayat asesmen tersimpan" },
];

const workflow = [
  "Pilih atau daftarkan pasien dengan data yang lengkap.",
  "Masukkan keluhan dan hasil pemeriksaan dalam satu alur kerja.",
  "Hasilkan asesmen, simpan riwayat, lalu lanjutkan monitoring pasien.",
];

export function LandingPage({ onLogin }: { onLogin: () => void }) {
  return (
    <main className="min-h-screen overflow-hidden bg-ink-950 text-white">
      <section className="relative isolate min-h-[100vh] bg-[#081529] px-5 py-6 sm:px-8 lg:px-10">
        <img
          src="/landing-hero.png"
          alt="Ruang kerja klinis apotek modern"
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_18%,rgba(23,55,101,0.100),transparent_12rem),radial-gradient(circle_at_100%_36%,rgba(255,255,255,0.035),transparent_14rem),linear-gradient(90deg,rgba(5,14,29,0.995)_0%,rgba(8,21,41,0.99)_24%,rgba(16,36,73,0.97)_48%,rgba(23,55,101,0.70)_74%,rgba(23,55,101,0.42)_93%,rgba(255,255,255,0.018)_100%)]" />
        <div className="absolute inset-0 -z-10 landing-scan opacity-35" />
        <svg
          viewBox="0 0 760 520"
          aria-hidden="true"
          className="pointer-events-none absolute -left-28 top-8 z-0 hidden h-[300px] w-[430px] opacity-[0.3] drop-shadow-[0_12px_24px_rgba(0,0,0,0.10)] lg:block"
        >
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            <g stroke="#f7e9c7" strokeWidth="3" opacity="0.56">
              <path d="M95 95v84c0 58 39 96 91 96s91-38 91-96V95" />
              <path d="M95 95c0-20 32-20 32 0M245 95c0-20 32-20 32 0" />
              <path d="M186 275v52c0 44 35 80 79 80h37" />
              <circle cx="338" cy="407" r="37" />
            </g>
            <g stroke="#ffffff" strokeWidth="2" opacity="0.42">
              <path d="M398 112h96M446 64v96M602 146h62M633 115v62" />
            </g>
          </g>
        </svg>
        <svg
          viewBox="0 0 760 520"
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-32 z-0 hidden h-[340px] w-[480px] opacity-[0.3] drop-shadow-[0_8px_18px_rgba(0,0,0,0.08)] lg:block"
        >
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            <g stroke="#f7e9c7" strokeWidth="3" opacity="0.56">
              <path d="M475 88v76l-62 146c-15 36 11 76 50 76h88c39 0 65-40 50-76l-62-146V88" />
              <path d="M454 88h106M441 274h132M460 326h94" />
              <circle cx="491" cy="244" r="7" />
              <circle cx="535" cy="308" r="10" />
              <path d="M250 146v58l-42 112c-12 32 12 66 46 66h62c34 0 58-34 46-66l-42-112v-58" />
              <path d="M234 146h102M226 286h120" />
              <circle cx="280" cy="250" r="6" />
              <circle cx="314" cy="326" r="8" />
              <path d="M632 196v42l-30 78c-9 24 9 50 35 50h42c26 0 44-26 35-50l-30-78v-42" />
              <path d="M618 196h80M614 300h88" />
              <circle cx="658" cy="274" r="5" />
              <path d="M110 230v38l-28 72c-8 22 8 46 32 46h42c24 0 40-24 32-46l-28-72v-38" />
              <path d="M98 230h74M96 322h78" />
            </g>
            <g stroke="#ffffff" strokeWidth="2" opacity="0.42">
              <path d="M53 452c70-24 122-24 192 0s122 24 192 0 122-24 192 0" />
              <path d="M72 362h64m-32-32v64" />
            </g>
          </g>
        </svg>

        <div className="relative z-10 mx-auto flex min-h-[calc(92vh-48px)] max-w-7xl flex-col">
          <nav className="flex items-center justify-between gap-4">
            <div className="inline-flex backdrop-blur-2xl py-3">
              <img src="/logo-white.png" alt="PharmaCare Logo" className="h-14 w-48 object-contain object-center" />
            </div>
            <button
              type="button"
              onClick={onLogin}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-medium text-white shadow-[0_14px_36px_rgba(0,0,0,0.18)] backdrop-blur-xl hover:bg-white/16"
            >
              Masuk
              <ArrowRight size={15} />
            </button>
          </nav>

          <div className="grid flex-1 items-center gap-10 py-16 lg:grid-cols-[1fr_0.72fr]">
            <div className="animate-fade-up">
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold-200/20 bg-gold-200/10 px-3 py-1.5 text-xs font-medium text-gold-100 backdrop-blur-xl">
                <Sparkles size={14} />
                Platform klinis apotek untuk layanan yang lebih premium
              </p>
              <h1 className="max-w-4xl font-display text-4xl leading-[1.02] text-white sm:text-4xl lg:text-5xl">
                Asesmen farmasi yang terasa cepat, rapi, dan meyakinkan.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-sage-100/82">
                PharmaCare membantu apoteker mengelola pasien, membaca konteks klinis,
                menyusun asesmen, dan menjaga riwayat kerja dalam satu sistem yang elegan.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={onLogin}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-gold-300 via-gold-200 to-white px-6 py-3 text-sm font-semibold text-sage-900 shadow-[0_20px_48px_rgba(214,182,118,0.28)] hover:from-gold-200 hover:to-white"
                >
                  Mulai gunakan
                  <ArrowRight size={16} />
                </button>
                <a
                  href="#fitur"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-6 py-3 text-sm font-medium text-white shadow-[0_14px_36px_rgba(0,0,0,0.18)] backdrop-blur-xl hover:bg-white/16"
                >
                  Lihat kemampuan
                </a>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="relative">
              <div className="landing-float relative z-10 rounded-[30px] border border-white/14 bg-white/10 p-5 shadow-[0_28px_80px_rgba(0,0,0,0.30)] backdrop-blur-2xl">
                <div className="mb-5 flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-[0.18em] text-sage-100/70">
                    Status hari ini
                  </span>
                  <span className="rounded-full bg-emerald-400/16 px-3 py-1 text-xs font-medium text-emerald-100">
                    Siap dianalisis
                  </span>
                </div>
                <div className="space-y-3">
                  {metrics.map((item) => (
                    <div key={item.value} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/10 p-4">
                      <span className="font-mono text-sm text-gold-100">{item.value}</span>
                      <p className="text-sm text-sage-50/86">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              </div>
            </div>
          </div>

          <div className="mb-2 grid gap-3 border-t border-white/10 pt-5 text-xs text-sage-100/72 sm:grid-cols-3">
            <span>Kelola pasien dengan konteks lengkap</span>
            <span className="sm:text-center">Bangun arsip referensi klinis</span>
            <span className="sm:text-right">Buat asesmen yang siap ditindaklanjuti</span>
          </div>
        </div>
      </section>

      <section id="fitur" className="landing-line-silhouette relative overflow-hidden bg-[linear-gradient(180deg,#fbfdff_0%,#eef4fd_100%)] px-5 py-20 text-ink-900 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.72fr_1fr] lg:items-end">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-sage-600">Kenapa PharmaCare</p>
              <h2 className="mt-3 font-display text-4xl leading-tight text-ink-950 lg:text-5xl">
                Lebih dari sekadar catatan. Ini ruang kerja klinis yang terasa siap pakai.
              </h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-ink-500 lg:ml-auto">
              Dibuat untuk apotek yang ingin layanan klinisnya lebih tertata, lebih profesional,
              dan lebih mudah dipertanggungjawabkan saat menangani pasien berulang.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {benefits.map((item, index) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="landing-card-hover rounded-[26px] border border-white/80 bg-white/72 p-6 shadow-[0_24px_70px_rgba(31,52,85,0.10)] backdrop-blur-2xl"
                  style={{ animationDelay: `${index * 120}ms` }}
                >
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-sage-50 text-sage-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.92)]">
                    <Icon size={21} />
                  </div>
                  <h3 className="font-display text-2xl text-ink-900">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-ink-500">{item.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#081529] px-5 py-20 sm:px-8 lg:px-10">
        <svg
          viewBox="0 0 760 520"
          aria-hidden="true"
          className="pointer-events-none absolute -right-28 -top-20 hidden h-[360px] w-[520px] opacity-14 drop-shadow-[0_16px_34px_rgba(0,0,0,0.12)] lg:block"
        >
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            <g stroke="#f7e9c7" strokeWidth="3" opacity="0.55">
              <path d="M95 95v84c0 58 39 96 91 96s91-38 91-96V95" />
              <path d="M95 95c0-20 32-20 32 0M245 95c0-20 32-20 32 0" />
              <path d="M186 275v52c0 44 35 80 79 80h37" />
              <circle cx="338" cy="407" r="37" />
              <path d="M520 86v92l-82 168c-19 39 10 84 53 84h116c43 0 72-45 53-84l-82-168V86" />
              <path d="M500 86h98M475 292h147M494 346h110" />
            </g>
            <g stroke="#ffffff" strokeWidth="2" opacity="0.40">
              <path d="M53 452c70-24 122-24 192 0s122 24 192 0 122-24 192 0" />
              <path d="M398 112h96M446 64v96M602 146h62M633 115v62" />
            </g>
          </g>
        </svg>
        <svg
          viewBox="0 0 760 520"
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-28 -left-32 hidden h-[360px] w-[520px] opacity-12 drop-shadow-[0_16px_34px_rgba(0,0,0,0.10)] lg:block"
        >
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            <g stroke="#f7e9c7" strokeWidth="3" opacity="0.55">
              <path d="M520 86v92l-82 168c-19 39 10 84 53 84h116c43 0 72-45 53-84l-82-168V86" />
              <path d="M500 86h98M475 292h147M494 346h110" />
              <circle cx="526" cy="254" r="8" />
              <circle cx="578" cy="322" r="11" />
              <circle cx="542" cy="375" r="6" />
            </g>
            <g stroke="#ffffff" strokeWidth="2" opacity="0.40">
              <path d="M53 452c70-24 122-24 192 0s122 24 192 0 122-24 192 0" />
              <path d="M72 362h64m-32-32v64" />
            </g>
          </g>
        </svg>
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="relative min-h-[420px] overflow-hidden rounded-[34px] border border-white/12 shadow-[0_34px_110px_rgba(0,0,0,0.34)]">
            <img
              src="/landing-hero.png"
              alt="Dashboard klinis dan dokumen farmasi"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,17,31,0.10)_0%,rgba(7,17,31,0.78)_100%)]" />
            <div className="absolute bottom-5 left-5 right-5 rounded-3xl border border-white/14 bg-white/12 p-5 backdrop-blur-2xl">
              <div className="mb-3 flex items-center gap-2 text-gold-100">
                <BadgeCheck size={16} />
                <span className="text-xs font-medium uppercase tracking-[0.16em]">Konteks klinis tersusun</span>
              </div>
              <p className="max-w-xl text-sm leading-7 text-white/82">
                Riwayat pasien, referensi, dan hasil asesmen berada dalam alur yang sama,
                sehingga tim lebih mudah melanjutkan pekerjaan berikutnya.
              </p>
            </div>
          </div>

          <div>
            <FileText size={26} className="text-gold-200" />
            <h2 className="mt-6 font-display text-3xl leading-tight text-white lg:text-4xl">
              Dari data pasien menjadi keputusan farmasi yang siap ditindaklanjuti.
            </h2>
            <p className="mt-5 text-sm leading-7 text-sage-100/74">
              Alur kerja dibuat sederhana agar apoteker bisa fokus pada penilaian klinis,
              bukan berpindah-pindah alat.
            </p>
            <div className="mt-4 grid gap-2">
              {workflow.map((item, index) => (
                <div key={item} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.07] p-2 backdrop-blur-xl">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-200 text-sm font-semibold text-sage-900">
                    {index + 1}
                  </span>
                  <p className="pt-1 text-sm leading-6 text-sage-50/82">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,#081529_0%,#102449_100%)] px-5 pb-12 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-5 rounded-[30px] border border-gold-200/16 bg-gold-200/10 px-6 py-8 text-white shadow-[0_26px_80px_rgba(0,0,0,0.24)] backdrop-blur-2xl sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-gold-100">
              <UsersRound size={16} />
              <span className="text-xs font-medium uppercase tracking-[0.16em]">Untuk tim apotek modern</span>
            </div>
            <h2 className="font-display text-3xl">Mulai rapikan layanan klinis apotek hari ini.</h2>
          </div>
          <button
            type="button"
            onClick={onLogin}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-sage-900 shadow-[0_16px_42px_rgba(255,255,255,0.16)] hover:bg-sage-50"
          >
            Masuk ke aplikasi
            <ArrowRight size={16} />
          </button>
        </div>
      </section>
    </main>
  );
}
