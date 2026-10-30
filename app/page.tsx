"use client";

import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  WifiOff,
  CheckCircle2,
  Lock,
  Clock,
  Monitor,
  BarChart3,
  BookMarked,
  User
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
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-8 items-center">
          
          {/* --- KOLOM KIRI: TEKS & BRANDING (Z-INDEX TINGGI AGAR TIDAK TERTUTUP) --- */}
          <div className="relative z-20 text-center lg:text-left animate-fade-in-up">
            
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
                onClick={() => router.push("/login-guru")}
                className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all"
              >
                <Lock className="w-5 h-5 mr-2 text-slate-400" />
                Masuk Guru
              </button>
            </div>
          </div>

          {/* --- KOLOM KANAN: MOCKUP 3D --- */}
          <div className="relative z-10 flex justify-center items-center mt-16 lg:mt-0 perspective-1000">
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-3xl"></div>

            {/* Container Ilustrasi */}
            <div className="relative w-full max-w-lg">
              
              {/* 1. ELEMEN MELAYANG: Kartu Nilai (Kiri Atas) */}
              <div className="absolute -top-12 -left-6 lg:-left-12 bg-slate-800/90 backdrop-blur-xl border border-slate-600 p-4 rounded-2xl shadow-2xl animate-float z-30 w-40 transform -rotate-6">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nilai Akhir</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-3xl font-black text-white">98<span className="text-xs text-slate-500 font-normal">/100</span></div>
                <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2">
                  <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: '98%' }}></div>
                </div>
              </div>

              {/* 2. ELEMEN MELAYANG: Grafik Statistik (Kiri Bawah) */}
              <div className="absolute -bottom-12 -left-8 lg:-left-16 bg-slate-800/90 backdrop-blur-xl border border-slate-600 p-4 rounded-2xl shadow-2xl animate-float-slow z-30 w-48 transform rotate-3">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-amber-400" />
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Statistik Kelas</span>
                </div>
                <div className="flex items-end justify-between gap-1.5 h-12">
                  <div className="w-3 bg-blue-500 rounded-t h-[40%]"></div>
                  <div className="w-3 bg-blue-500 rounded-t h-[65%]"></div>
                  <div className="w-3 bg-amber-400 rounded-t h-[95%]"></div>
                  <div className="w-3 bg-blue-500 rounded-t h-[75%]"></div>
                  <div className="w-3 bg-blue-500 rounded-t h-[55%]"></div>
                </div>
              </div>

              {/* 3. ELEMEN MELAYANG: Buku 3D (Kanan Bawah) */}
              <div className="absolute -bottom-8 -right-4 lg:-right-10 w-32 h-40 bg-gradient-to-br from-blue-500 to-indigo-700 rounded-r-2xl rounded-l-sm shadow-[15px_15px_30px_rgba(0,0,0,0.5)] z-30 animate-float-slow transform rotate-12 border-l-[10px] border-indigo-900 p-4 flex flex-col">
                <BookMarked className="w-8 h-8 text-white/80 mb-3" />
                <div className="w-full h-1.5 bg-white/20 rounded mb-1.5"></div>
                <div className="w-full h-1.5 bg-white/20 rounded mb-1.5"></div>
                <div className="w-3/4 h-1.5 bg-white/20 rounded"></div>
                <div className="absolute -bottom-2 -left-2 w-5 h-5 bg-emerald-500 rounded-full border-2 border-slate-800"></div>
              </div>

              {/* 4. ELEMEN MELAYANG: Smartphone (Kanan Atas) */}
              <div className="absolute -top-10 -right-8 lg:-right-12 w-24 h-48 bg-slate-800 rounded-[1.5rem] border-[5px] border-slate-600 shadow-2xl z-30 animate-float transform -rotate-6 flex flex-col overflow-hidden">
                <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-8 h-1.5 bg-slate-600 rounded-full z-20"></div>
                <div className="w-full h-full bg-[#131C2F] p-2 pt-6 flex flex-col">
                  <div className="flex items-center gap-1.5 mb-3">
                    <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center">
                      <User className="w-2.5 h-2.5 text-slate-400" />
                    </div>
                    <div className="w-10 h-1.5 bg-slate-700 rounded"></div>
                  </div>
                  <div className="w-full h-12 bg-blue-500/20 border border-blue-500/30 rounded-lg mb-2 flex items-center justify-center text-blue-400 text-[8px] font-bold">
                    UJIAN AKTIF
                  </div>
                  <div className="space-y-1.5">
                    <div className="w-full h-1.5 bg-slate-700 rounded"></div>
                    <div className="w-3/4 h-1.5 bg-slate-700 rounded"></div>
                  </div>
                </div>
              </div>

              {/* --- MOCKUP LAPTOP --- */}
              <div className="relative z-20 w-[95%] mx-auto mt-6">
                {/* Layar Laptop */}
                <div className="bg-slate-800 border-[8px] border-slate-700 rounded-t-2xl shadow-2xl overflow-hidden relative">
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-600 rounded-full z-30"></div>
                  
                  {/* UI di dalam Layar */}
                  <div className="bg-[#131C2F] h-[300px] flex flex-col relative">
                    {/* Header UI */}
                    <div className="bg-slate-900 px-4 py-2 flex items-center justify-between border-b border-slate-700/50">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                        <Lock className="w-3 h-3 text-emerald-400" /> ujianku-cbt.vercel.app
                      </div>
                      <div className="w-8"></div>
                    </div>

                    {/* Konten Ujian */}
                    <div className="flex flex-1 overflow-hidden p-4 gap-4">
                      {/* Sidebar Mini */}
                      <div className="w-10 flex flex-col items-center gap-1.5 shrink-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center mb-1">
                          <Monitor className="w-4 h-4 text-white" />
                        </div>
                        {[1, 2, 3, 4].map((n) => (
                          <div key={n} className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold ${n === 3 ? 'bg-amber-400 text-slate-900' : 'bg-slate-800 text-slate-500'}`}>
                            {n}
                          </div>
                        ))}
                      </div>

                      {/* Area Soal */}
                      <div className="flex-1 flex flex-col">
                        <div className="flex justify-between items-center mb-3">
                          <div className="text-[10px] font-bold text-slate-300">Soal 3 dari 20</div>
                          <div className="flex items-center gap-1 text-amber-400 font-mono text-[10px] bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                            <Clock className="w-2.5 h-2.5" /> 45:00
                          </div>
                        </div>
                        <div className="text-slate-200 text-xs font-medium leading-relaxed mb-4">
                          Hitunglah besar tekanan hidrostatis yang dialami seekor ikan pada kedalaman 5 meter!
                        </div>
                        <div className="space-y-1.5 mt-auto">
                          {['A', 'B', 'C'].map((opt, i) => (
                            <div key={opt} className={`flex items-center gap-2 p-1.5 rounded-lg border ${i === 1 ? 'border-amber-400 bg-amber-400/10' : 'border-slate-700 bg-slate-800/30'}`}>
                              <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${i === 1 ? 'bg-amber-400 text-slate-900' : 'bg-slate-700 text-slate-400'}`}>
                                {opt}
                              </div>
                              <div className={`h-1.5 rounded ${i === 1 ? 'bg-amber-400/60 w-20' : 'bg-slate-600 w-16'}`}></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Basis Laptop */}
                <div className="relative mx-auto w-full h-4 bg-slate-600 rounded-b-xl border-t border-slate-500 shadow-xl z-10 flex justify-center">
                   <div className="w-16 h-1 bg-slate-700 rounded-b-md absolute top-0"></div>
                   <div className="w-20 h-1 bg-slate-700/50 rounded-sm absolute -bottom-1.5"></div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-24 text-center border-t border-slate-800 pt-8 relative z-20">
          <p className="text-sm font-medium text-slate-500">
            &copy; 2026 UjianKu. Dibuat mandiri untuk pembelajaran yang lebih baik. by Dede Yopi
          </p>
        </div>
      </div>
    </main>
  );
}