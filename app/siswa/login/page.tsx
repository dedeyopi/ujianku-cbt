"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, ArrowRight, AlertCircle, User, Sparkles, Lock, BookMarked, CheckCircle2 } from "lucide-react";
import { loginStudent } from "../../lib/auth";

export default function LoginSiswaPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin() {
    if (!username.trim() || !password) {
      setError("Username dan kata sandi harus diisi.");
      return;
    }
    
    setLoading(true);
    setError("");
    
    const res = await loginStudent(username, password);
    
    if (res.success) {
      router.push("/siswa");
    } else {
      setError(res.message || "Username atau kata sandi salah.");
      setPassword("");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex bg-[#0B1120] font-sans overflow-hidden relative">
      
      {/* BACKGROUND GLOBAL */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "40px 40px" }}></div>
      
      {/* KOLOM KIRI: FORM LOGIN */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-20">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Brand */}
          <div className="text-left mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-black tracking-tighter text-white">
                Ujian<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">Ku</span>
              </h1>
            </div>
            <p className="text-slate-400 text-sm font-medium mb-6">Jujur dalam ujian, tumbuh dalam proses belajar</p>
            
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-semibold">
              <GraduationCap className="w-4 h-4 text-amber-400" /> Portal Siswa
            </div>
          </div>

          {/* Form Card */}
          <div className="p-8 bg-slate-800/60 backdrop-blur-xl border border-slate-700 shadow-2xl rounded-3xl">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Username</label>
                <div className="relative">
                  <User className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Masukkan username Anda"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    autoFocus
                    disabled={loading}
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-600 bg-slate-900/50 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition text-base"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Kata Sandi</label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    placeholder="Masukkan kata sandi"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    disabled={loading}
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-600 bg-slate-900/50 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition text-base"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 mt-5 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <AlertCircle className="w-5 h-5 shrink-0" /> {error}
              </div>
            )}

            <button 
              onClick={handleLogin} 
              disabled={loading}
              className="w-full mt-6 inline-flex items-center justify-center font-bold rounded-xl px-6 py-4 text-base text-slate-900 bg-amber-400 hover:bg-amber-300 transition-all shadow-[0_0_20px_rgba(251,191,36,0.2)] hover:shadow-[0_0_30px_rgba(251,191,36,0.4)] disabled:opacity-50"
            >
              {loading ? "Memeriksa..." : "Masuk ke Ujian"} <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>

          <div className="text-left mt-8">
            <a href="/" className="text-sm font-medium text-slate-500 hover:text-white transition flex items-center gap-2">
              ← Kembali ke beranda
            </a>
          </div>
        </div>
      </div>

      {/* KOLOM KANAN: ILUSTRASI (Hanya tampil di Desktop) */}
      <div className="hidden lg:flex w-1/2 relative items-center justify-center bg-slate-900/30 border-l border-slate-800 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[80px]"></div>
        
        {/* Komposisi Ilustrasi */}
        <div className="relative w-full max-w-lg">
          {/* Elemen 1: Kartu Ujian */}
          <div className="absolute top-10 left-10 bg-slate-800/80 backdrop-blur-xl border border-slate-600 p-5 rounded-2xl shadow-2xl animate-float z-30 w-48 transform -rotate-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Nilai Akhir</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-4xl font-black text-white">98<span className="text-sm text-slate-500 font-normal">/100</span></div>
          </div>

          {/* Elemen 2: Buku */}
          <div className="absolute bottom-20 right-10 w-32 h-44 bg-gradient-to-br from-blue-500 to-indigo-700 rounded-r-2xl rounded-l-sm shadow-[20px_20px_40px_rgba(0,0,0,0.5)] z-20 animate-float-slow transform rotate-12 border-l-[10px] border-indigo-900 p-4 flex flex-col">
            <BookMarked className="w-10 h-10 text-white/80 mb-3" />
            <div className="w-full h-1.5 bg-white/20 rounded mb-1.5"></div>
            <div className="w-full h-1.5 bg-white/20 rounded mb-1.5"></div>
            <div className="w-3/4 h-1.5 bg-white/20 rounded"></div>
          </div>

          {/* Elemen 3: Lingkaran Dekoratif */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-[2px] border-dashed border-slate-600 rounded-full animate-[spin_20s_linear_infinite] z-10"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-slate-700 rounded-full z-10"></div>
          
          {/* Logo Besar Tengah */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            <div className="w-24 h-24 rounded-3xl bg-slate-800/80 backdrop-blur-xl border border-slate-600 shadow-[0_0_50px_rgba(251,191,36,0.2)] flex items-center justify-center">
              <GraduationCap className="w-12 h-12 text-amber-400" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}