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
  Clock,
  Monitor
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

          {/* --- KOLOM KANAN: MOCKUP VISUAL REALISTIS --- */}
          <div className="lg:col-span-6 relative animate-fade-in-up flex justify-center" style={{ animationDelay: "0.2s" }}>
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-3xl"></div>

            <div className="relative w-full max-w-lg mt-8 lg:mt-0">
              
              {/* Kartu Nilai (Floating) */}
              <div className="absolute -top-10 -right-4 lg:-right-12 bg-slate-800/90 backdrop-blur-xl border border-slate-600 p-5 rounded-2xl shadow-2xl animate-float z-30 w-44">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nilai Akhir</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-4xl font-black text-white">98<span className="text-sm text-slate-500 font-normal">/100</span></div>
                <div className="w-full bg-slate-700 h-2 rounded-full mt-3">
                  <div className="bg-emerald-400 h-2 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)]" style={{ width: '98%' }}></div>
                </div>
              </div>

              {/* Ikon Perisai (Floating) */}
              <div className="absolute top-1/2 -left-6 lg:-left-12 bg-slate-800/90 backdrop-blur-xl border border-slate-600 p-4 rounded-2xl shadow-2xl animate-float-slow z-30">
                <ShieldCheck className="w-10 h-10 text-amber-400" />
                <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-800"></div>
              </div>

              {/* --- UI MOCKUP UTAMA (JENDELA APLIKASI) --- */}
              <div className="bg-[#131C2F] border border-slate-700 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden relative z-20 flex flex-col h-[400px]">
                
                {/* Top Bar Window */}
                <div className="bg-slate-900 px-4 py-3 flex items-center justify-between border-b border-slate-700/50">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-800 px-3 py-1 rounded-md border border-slate-700">
                    <Lock className="w-3 h-3 text-emerald-400" /> ujianku-cbt.vercel.app
                  </div>
                  <div className="w-12"></div> {/* Spacer */}
                </div>

                {/* Konten Aplikasi */}
                <div className="flex flex-1 overflow-hidden">
                  
                  {/* Sidebar Mini (Navigasi Soal) */}
                  <div className="w-16 bg-slate-900/50 border-r border-slate-800 flex flex-col items-center py-4 gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center mb-2">
                      <Monitor className="w-4 h-4 text-white" />
                    </div>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <div key={n} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${n === 3 ? 'bg-amber-400 text-slate-900' : n < 3 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                        {n}
                      </div>
                    ))}
                  </div>

                  {/* Area Soal Utama */}
                  <div className="flex-1 p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                      <div className="text-sm font-bold text-slate-300">Soal 3 dari 20</div>
                      <div className="flex items-center gap-1.5 text-amber-400 font-mono text-sm bg-amber-400/10 px-2.5 py-1 rounded-md border border-amber-400/20">
                        <Clock className="w-3.5 h-3.5" /> 45:00
                      </div>
                    </div>

                    <div className="text-slate-200 text-sm font-medium leading-relaxed mb-6">
                      Hitunglah besar tekanan hidrostatis yang dialami seekor ikan jika diketahui massa jenis air 1000 kg/m³ dan percepatan gravitasi 10 m/s² pada kedalaman 5 meter!
                    </div>

                    {/* Pilihan Jawaban */}
                    <div className="space-y-2 mt-auto">
                      {['A', 'B', 'C', 'D'].map((opt, i) => (
                        <div key={opt} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${i === 1 ? 'border-amber-400 bg-amber-400/10' : 'border-slate-700 bg-slate-800/30'}`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 1 ? 'bg-amber-400 text-slate-900' : 'bg-slate-700 text-slate-400'}`}>
                            {opt}
                          </div>
                          <div className={`h-2 rounded ${i === 1 ? 'bg-amber-400/60 w-32' : 'bg-slate-600 w-24'}`}></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Aplikasi */}
                <div className="bg-slate-900/80 px-6 py-3 border-t border-slate-800 flex justify-between items-center">
                  <div className="text-[10px] text-slate-500 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Tersimpan otomatis
                  </div>
                  <div className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold cursor-pointer transition-colors">
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