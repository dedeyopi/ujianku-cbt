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
    <main className="min-h-screen relative overflow-hidden bg-[#f8fafc] flex flex-col justify-center">
      {/* --- BACKGROUND EFEK CAHAYA (GLOW) --- */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/20 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-400/20 blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-indigo-400/10 blur-[100px] pointer-events-none"></div>

      {/* Grid Pattern Halus */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      ></div>

      <div className="relative max-w-7xl mx-auto px-6 py-12 lg:py-24 w-full">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          {/* --- KOLOM KIRI: BRANDING & ILUSTRASI --- */}
          <div className="text-center lg:text-left animate-fade-in-up">
            
            {/* Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/80 backdrop-blur-md shadow-sm border border-slate-200/60 text-blue-700 text-sm font-bold mb-8">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
              </span>
              Platform Ujian Digital Mandiri
            </div>

            {/* Logo & Judul Utama */}
            <div className="flex items-center justify-center lg:justify-start gap-4 mb-6">
              <div className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl shadow-blue-500/30 flex items-center justify-center shrink-0 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-6xl md:text-7xl font-black tracking-tighter text-slate-900">
                Ujian<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Ku</span>
              </h1>
            </div>

            {/* Tagline */}
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-5 leading-snug">
              Jujur dalam ujian, <br className="hidden md:block" />
              tumbuh dalam proses belajar.
            </h2>
            <p className="text-lg text-slate-500 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Platform asesmen modern yang mengedepankan integritas dan kemudahan dalam proses belajar mengajar. Cepat, aman, dan terkendali penuh oleh Anda.
            </p>

            {/* Ilustrasi dengan Efek Glow di Belakangnya */}
            <div className="relative max-w-lg mx-auto lg:mx-0">
               <div className="absolute inset-0 bg-gradient-to-tr from-blue-200 to-indigo-100 rounded-full blur-2xl opacity-60 transform scale-110"></div>
               <div className="relative z-10 hidden sm:block">
                 <HeroIllustration />
               </div>
            </div>
          </div>

          {/* --- KOLOM KANAN: KARTU LOGIN & FITUR --- */}
          <div className="animate-fade-in-up flex flex-col gap-5 w-full max-w-md mx-auto lg:max-w-none" style={{ animationDelay: "0.15s" }}>
            
            {/* Kartu Siswa */}
            <button
              onClick={() => router.push("/siswa/login")}
              className="w-full text-left group"
            >
              <Card className="p-8 bg-white/70 backdrop-blur-xl border border-white/50 shadow-xl shadow-slate-200/50 rounded-[2rem] hover:shadow-2xl hover:bg-white hover:-translate-y-1.5 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/50 rounded-bl-full translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform"></div>
                <div className="flex items-start gap-6 relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-blue-100 group-hover:bg-blue-600 transition-colors duration-300 flex items-center justify-center shrink-0 shadow-inner">
                    <GraduationCap className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <h3 className="font-extrabold text-2xl text-slate-900 mb-2">
                      Masuk sebagai Siswa
                    </h3>
                    <p className="text-base text-slate-500 mb-4 font-medium">
                      Ikuti ujian yang tersedia untuk kelas Anda dengan mudah.
                    </p>
                    <span className="text-sm text-blue-600 font-bold inline-flex items-center gap-2 group-hover:gap-3 transition-all">
                      Mulai Ujian
                      <ArrowRight className="w-5 h-5" />
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
              <Card className="p-8 bg-white/70 backdrop-blur-xl border border-white/50 shadow-xl shadow-slate-200/50 rounded-[2rem] hover:shadow-2xl hover:bg-white hover:-translate-y-1.5 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/50 rounded-bl-full translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform"></div>
                <div className="flex items-start gap-6 relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 group-hover:bg-emerald-600 transition-colors duration-300 flex items-center justify-center shrink-0 shadow-inner">
                    <BookOpenCheck className="w-8 h-8 text-emerald-600 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <h3 className="font-extrabold text-2xl text-slate-900 mb-2">
                      Masuk sebagai Guru
                    </h3>
                    <p className="text-base text-slate-500 mb-4 font-medium">
                      Kelola ujian, bank soal, dan pantau siswa secara real-time.
                    </p>
                    <span className="text-sm text-emerald-600 font-bold inline-flex items-center gap-2 group-hover:gap-3 transition-all">
                      Masuk Panel
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  </div>
                </div>
              </Card>
            </button>

            {/* Strip Fitur Unggulan */}
            <div className="mt-4 px-6 py-6 bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl shadow-sm">
              <div className="grid grid-cols-3 gap-4 text-center divide-x divide-slate-200/60">
                <div className="flex flex-col items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-emerald-500" />
                  <p className="text-xs text-slate-600 font-bold uppercase tracking-wide">Anti-Cheat</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Zap className="w-6 h-6 text-amber-500" />
                  <p className="text-xs text-slate-600 font-bold uppercase tracking-wide">Auto-Save</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <WifiOff className="w-6 h-6 text-blue-500" />
                  <p className="text-xs text-slate-600 font-bold uppercase tracking-wide">Siap Offline</p>
                </div>
              </div>
            </div>
            
          </div>
        </div>

        {/* Footer */}
        <div className="mt-20 text-center">
          <p className="text-sm font-medium text-slate-400">
            v1.0 • Dibuat mandiri untuk pembelajaran yang lebih baik
          </p>
        </div>
      </div>
    </main>
  );
}