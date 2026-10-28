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
  CheckCircle2,
  Lock,
} from "lucide-react";
import { Card } from "./components/Card";

export default function HomePage() {
  const router = useRouter();

  return (
    <main className="min-h-screen relative overflow-hidden bg-[#0B1120] flex flex-col justify-center font-sans">
      
      {/* --- BACKGROUND EFEK CAHAYA & GRID --- */}
      <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none translate-y-1/3 translate-x-1/3"></div>
      
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      ></div>

      <div className="relative max-w-7xl mx-auto px-6 py-12 lg:py-20 w-full z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* --- KOLOM KIRI: TEKS & BRANDING (5/12) --- */}
          <div className="lg:col-span-6 text-center lg:text-left animate-fade-in-up">
            
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-900/30 border border-blue-700/50 text-amber-400 text-sm font-semibold mb-8 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              Platform Ujian Digital Mandiri
            </div>

            {/* Judul Raksasa */}
            <h1 className="text-6xl md:text-7xl lg:text-[5.5rem] font-black tracking-tighter text-white leading-[1.1] mb-6">
              Ujian<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">Ku</span>
            </h1>
            
            <h2 className="text-2xl md:text-3xl font-bold text-slate-200 mb-6">
              Jujur dalam ujian, <br className="hidden lg:block" />
              tumbuh dalam proses belajar.
            </h2>
            
            <p className="text-lg text-slate-400 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Platform asesmen modern yang mengedepankan integritas dan kemudahan dalam proses belajar mengajar. Cepat, aman, dan terkendali penuh oleh Anda.
            </p>

            {/* Fitur Strip di Kiri Bawah */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm font-medium text-slate-300 mb-12">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" /> Anti-Cheat
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" /> Auto-Save
              </div>
              <div className="flex items-center gap-2">
                <WifiOff className="w-5 h-5 text-blue-400" /> Siap Offline
              </div>
            </div>

            {/* Tombol CTA Utama (Arahkan ke Siswa) */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button
                onClick={() => router.push("/siswa/login")}
                className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-[0_0_20px_rgba(251,191,36,0.3)] hover:shadow-[0_0_30px_rgba(251,191,36,0.5)] transform hover:-translate-y-1"
              >
                Mulai Ujian Sekarang
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
              
              <button
                onClick={() => router.push("/guru/login")}
                className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all"
              >
                <Lock className="w-5 h-5 mr-2 text-slate-400" />
                Masuk Guru
              </button>
            </div>
          </div>

          {/* --- KOLOM KANAN: MOCKUP UI (6/12) --- */}
          <div className="lg:col-span-6 relative animate-fade-in-up flex justify-center" style={{ animationDelay: "0.2s" }}>
            
            {/* Lingkaran Cahaya di Belakang */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-3xl"></div>

            {/* Kontainer Mockup */}
            <div className="relative w-full max-w-lg">
              
              {/* Elemen Melayang 1: Kartu Nilai */}
              <div className="absolute -top-12 -right-8 bg-slate-800/80 backdrop-blur-md border border-slate-700 p-4 rounded-2xl shadow-2xl animate-float z-20 w-40">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nilai Akhir</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-3xl font-black text-white">98<span className="text-sm text-slate-500 font-normal">/100</span></div>
                <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2">
                  <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: '98%' }}></div>
                </div>
              </div>

              {/* Elemen Melayang 2: Ikon Kunci */}
              <div className="absolute bottom-10 -left-10 bg-slate-800/80 backdrop-blur-md border border-slate-700 p-3 rounded-2xl shadow-2xl animate-float-slow z-20">
                <ShieldCheck className="w-8 h-8 text-amber-400" />
              </div>

              {/* Elemen Melayang 3: Kubus Geometris */}
              <div className="absolute -bottom-8 right-10 w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl transform rotate-12 shadow-lg animate-float z-0 opacity-50"></div>

              {/* Kartu UI Utama (Mockup Soal) */}
              <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700 rounded-3xl shadow-2xl overflow-hidden relative z-10">
                {/* Header Mockup */}
                <div className="bg-slate-900/50 px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Ujian Matematika</div>
                      <div className="text-[10px] text-slate-400">Soal 12 dari 40</div>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-xs font-bold font-mono">
                    09:45
                  </div>
                </div>

                {/* Body Mockup (Soal) */}
                <div className="p-6">
                  <div className="text-slate-200 font-medium mb-6 leading-relaxed">
                    Hitunglah besar tekanan hidrostatis yang dialami seekor ikan jika diketahui massa jenis air 1000 kg/m³ dan percepatan gravitasi 10 m/s² pada kedalaman 5 meter!
                  </div>
                  
                  {/* Pilihan Jawaban */}
                  <div className="space-y-3">
                    {['A', 'B', 'C', 'D'].map((opt, i) => (
                      <div key={opt} className={`flex items-center gap-3 p-3 rounded-xl border ${i === 1 ? 'border-amber-500/50 bg-amber-500/10' : 'border-slate-700 bg-slate-800/50'}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 1 ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-300'}`}>
                          {opt}
                        </div>
                        <div className={`h-2 rounded ${i === 1 ? 'bg-amber-400/50 w-32' : 'bg-slate-600 w-24'}`}></div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Mockup */}
                <div className="bg-slate-900/50 px-6 py-4 border-t border-slate-700/50 flex justify-between items-center">
                  <div className="text-xs text-slate-500">Auto-saved baru saja</div>
                  <div className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold">Selanjutnya</div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-24 text-center border-t border-slate-800 pt-8">
                    <p className="text-sm font-medium text-slate-500">
            &copy; 2026 UjianKu. Dibuat mandiri by Dede Yopi untuk pembelajaran yang lebih baik.
          </p>
        </div>
      </div>
    </main>
  );
}