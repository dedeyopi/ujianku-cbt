"use client";

import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  WifiOff,
  CheckCircle2,
  Lock,
  Laptop,
  BookOpen,
  Pencil,
  FileText
} from "lucide-react";

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
          
          {/* --- KOLOM KIRI: TEKS & BRANDING --- */}
          <div className="lg:col-span-6 text-center lg:text-left animate-fade-in-up">
            
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-900/30 border border-blue-700/50 text-amber-400 text-sm font-semibold mb-8 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              Platform Ujian Digital Mandiri
            </div>

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

          {/* --- KOLOM KANAN: MOCKUP VISUAL --- */}
          <div className="lg:col-span-6 relative animate-fade-in-up flex justify-center" style={{ animationDelay: "0.2s" }}>
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-3xl"></div>

            <div className="relative w-full max-w-lg mt-8 lg:mt-0">
              
              {/* Kartu Nilai (Floating) */}
              <div className="absolute -top-12 -right-6 lg:-right-10 bg-slate-800/80 backdrop-blur-md border border-slate-700 p-4 rounded-2xl shadow-2xl animate-float z-20 w-44">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nilai Akhir</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-3xl font-black text-white">98<span className="text-sm text-slate-500 font-normal">/100</span></div>
                <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2">
                  <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: '98%' }}></div>
                </div>
              </div>

              {/* Ikon Perisai (Floating) */}
              <div className="absolute bottom-16 -left-6 lg:-left-10 bg-slate-800/80 backdrop-blur-md border border-slate-700 p-4 rounded-2xl shadow-2xl animate-float-slow z-20">
                <ShieldCheck className="w-8 h-8 text-amber-400" />
              </div>

              {/* Elemen Dekoratif (Kubus) */}
              <div className="absolute -bottom-6 right-12 w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl transform rotate-12 shadow-lg animate-float z-0 opacity-50"></div>

              {/* KARTU UI UTAMA (MOCKUP) */}
              <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700 rounded-3xl shadow-2xl overflow-hidden relative z-10">
                
                {/* Header Mockup */}
                <div className="bg-slate-900/50 px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Ujian Matematika</div>
                      <div className="text-[10px] text-slate-400">Lembar Jawaban Siswa</div>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-xs font-bold font-mono">
                    09:45
                  </div>
                </div>

                {/* Body Mockup (ILUSTRASI BARU) */}
                <div className="p-8 pb-12 flex items-center justify-center relative">
                  {/* Latar belakang ilustrasi */}
                  <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent"></div>
                  
                  {/* Komposisi Ilustrasi */}
                  <div className="relative flex items-end justify-center gap-6 w-full max-w-xs">
                    {/* Buku */}
                    <div className="w-16 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg shadow-lg transform -rotate-12 relative z-10 flex flex-col items-center pt-2 animate-float-slow">
                      <div className="w-10 h-1 bg-white/40 rounded mb-1"></div>
                      <div className="w-8 h-1 bg-white/40 rounded mb-1"></div>
                      <div className="w-10 h-1 bg-white/40 rounded"></div>
                    </div>
                    
                    {/* Laptop (Pusat) */}
                    <div className="relative z-20 transform scale-125">
                      <Laptop className="w-24 h-24 text-blue-400" strokeWidth={1.5} />
                      <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full"></div>
                    </div>
                    
                    {/* Pensil */}
                    <div className="w-8 h-24 bg-gradient-to-b from-amber-300 to-amber-500 rounded-t-md rounded-b-sm shadow-lg transform rotate-12 relative z-10 animate-float flex flex-col items-center justify-end pb-2">
                      <div className="w-8 h-4 bg-slate-200 rounded-t-md absolute top-0"></div>
                      <div className="w-8 h-4 bg-amber-600/50 absolute top-2"></div>
                    </div>
                  </div>
                </div>

                {/* Footer Mockup */}
                <div className="bg-slate-900/50 px-6 py-4 border-t border-slate-700/50 flex justify-between items-center">
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Auto-saved baru saja
                  </div>
                  <div className="px-4 py-2 bg-amber-500 hover:bg-amber-400 transition-colors text-slate-900 rounded-lg text-xs font-bold">
                    Selanjutnya
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-24 text-center border-t border-slate-800 pt-8">
          <p className="text-sm font-medium text-slate-500">
            &copy; 2025 UjianKu. Dibuat mandiri untuk pembelajaran yang lebih baik.
          </p>
        </div>
      </div>
    </main>
  );
}