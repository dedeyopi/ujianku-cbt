"use client";

import { useRouter } from "next/navigation";
import {
  Sparkles,
  GraduationCap,
  BookOpenCheck,
  ArrowRight,
  ShieldCheck,
  Zap,
  WifiOff,
} from "lucide-react";
import { Card } from "./components/Card";
import { HeroIllustration } from "./components/HeroIllustration";

export default function HomePage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 relative overflow-hidden">
      {/* Dekorasi background */}
      <div className="absolute top-[-240px] left-[-240px] w-[640px] h-[640px] rounded-full bg-blue-200/40 blur-3xl"></div>
      <div className="absolute bottom-[-240px] right-[-240px] w-[640px] h-[640px] rounded-full bg-indigo-200/40 blur-3xl"></div>
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      ></div>

      <div className="relative max-w-6xl mx-auto px-6 py-10 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Kolom Kiri: Branding + Ilustrasi */}
          <div className="text-center lg:text-left animate-fade-in-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white shadow-sm border border-blue-100 text-blue-700 text-xs font-semibold mb-6">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              Platform Ujian Digital Mandiri
            </div>

            {/* Logo + Nama */}
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 flex items-center justify-center shrink-0">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900">
                Ujian<span className="text-blue-600">Ku</span>
              </h1>
            </div>

            {/* Tagline */}
            <p className="text-xl lg:text-2xl font-semibold text-slate-800 mb-3">
              Jujur dalam ujian, tumbuh dalam proses belajar
            </p>
            <p className="text-sm lg:text-base text-slate-500 mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed">
              "Platform asesmen modern yang mengedepankan integritas dan kemudahan dalam proses belajar mengajar."
            </p>

            {/* Ilustrasi */}
            <div className="max-w-md mx-auto lg:mx-0 hidden sm:block">
              <HeroIllustration />
            </div>
          </div>

          {/* Kolom Kanan: Kartu Login + Fitur */}
          <div className="animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
            <div className="space-y-4">
              {/* Kartu Siswa */}
              <button
                onClick={() => router.push("/siswa/login")}
                className="w-full text-left group"
              >
                <Card className="p-6 hover:shadow-xl hover:border-blue-300 hover:-translate-y-1 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-100 group-hover:bg-blue-600 transition-colors flex items-center justify-center shrink-0">
                      <GraduationCap className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-bold text-lg text-slate-900 mb-1">
                        Masuk sebagai Siswa
                      </h2>
                      <p className="text-sm text-slate-500 mb-3">
                        Ikuti ujian yang tersedia untuk kelas Anda
                      </p>
                      <span className="text-xs text-blue-600 font-semibold inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                        Mulai ujian
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </Card>
              </button>

              {/* Kartu Guru */}
              <button
                onClick={() => router.push("/guru/login")}
                className="w-full text-left group"
              >
                <Card className="p-6 hover:shadow-xl hover:border-emerald-300 hover:-translate-y-1 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 group-hover:bg-emerald-600 transition-colors flex items-center justify-center shrink-0">
                      <BookOpenCheck className="w-7 h-7 text-emerald-600 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-bold text-lg text-slate-900 mb-1">
                        Masuk sebagai Guru
                      </h2>
                      <p className="text-sm text-slate-500 mb-3">
                        Kelola ujian, soal, dan daftar siswa
                      </p>
                      <span className="text-xs text-emerald-600 font-semibold inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                        Masuk panel
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </Card>
              </button>

              {/* Fitur-fitur unggulan */}
              <Card className="p-5 bg-white/60 backdrop-blur-sm">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    </div>
                    <p className="text-xs text-slate-600 font-medium">
                      Anti-cheat
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-amber-600" />
                    </div>
                    <p className="text-xs text-slate-600 font-medium">
                      Auto-save
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                      <WifiOff className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="text-xs text-slate-600 font-medium">
                      Siap offline
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 lg:mt-16 text-center">
          <p className="text-xs text-slate-400">
            v1.0 • Dibuat mandiri untuk pembelajaran yang lebih baik
          </p>
        </div>
      </div>
    </main>
  );
}