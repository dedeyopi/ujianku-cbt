"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, ArrowRight, AlertCircle, User, Sparkles, ShieldCheck, BarChart3, Users } from "lucide-react";
import { loginTeacher } from "../lib/auth";

export default function LoginGuruPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin() {
    if (username.trim() === "" || password === "") {
      setError("Username dan kata sandi harus diisi.");
      return;
    }
    
    setLoading(true);
    setError("");
    
    const res = await loginTeacher(username, password);
    
    if (res.success) {
      router.push("/guru");
    } else {
      setError(res.message || "Username atau kata sandi salah.");
      setPassword("");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex bg-[#0B1120] font-sans overflow-hidden relative">
      
      {/* --- BACKGROUND EFEK CAHAYA (MENYATU UNTUK SELURUH HALAMAN) --- */}
      <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 -translate-x-1/3"></div>
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none translate-y-1/3 translate-x-1/3"></div>
      
      {/* Grid Pattern Halus */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "40px 40px" }}></div>
      
      <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center p-6 sm:p-12 relative z-10">
        
        {/* KOLOM KIRI: FORM LOGIN */}
        <div className="w-full lg:w-1/2 flex justify-center lg:justify-start animate-fade-in-up">
          <div className="w-full max-w-md">
            {/* Brand */}
            <div className="text-left mb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-black tracking-tighter text-white">
                  Ujian<span className="text-emerald-400">Ku</span>
                </h1>
              </div>
              <p className="text-slate-400 text-sm font-medium mb-6">Jujur dalam ujian, tumbuh dalam proses belajar</p>
              
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-semibold">
                <Lock className="w-4 h-4 text-emerald-400" /> Panel Guru
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
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-600 bg-slate-900/50 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition text-base"
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
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-600 bg-slate-900/50 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition text-base"
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
                className="w-full mt-6 inline-flex items-center justify-center font-bold rounded-xl px-6 py-4 text-base text-slate-900 bg-emerald-400 hover:bg-emerald-300 transition-all shadow-[0_0_20px_rgba(52,211,153,0.2)] hover:shadow-[0_0_30px_rgba(52,211,153,0.4)] disabled:opacity-50"
              >
                {loading ? "Memeriksa..." : "Masuk ke Panel"} <ArrowRight className="w-5 h-5 ml-2" />
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
        <div className="hidden lg:flex w-1/2 relative items-center justify-center">
          
          {/* Komposisi Ilustrasi (Diperbesar) */}
          <div className="relative w-full max-w-xl h-[500px]">
            
            {/* Lingkaran Abstrak di Belakang */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-slate-700/50 rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] border-[2px] border-dashed border-slate-700/80 rounded-full animate-[spin_30s_linear_infinite]"></div>

            {/* Elemen 1: Grafik */}
            <div className="absolute top-10 right-10 bg-slate-800/80 backdrop-blur-xl border border-slate-600 p-5 rounded-2xl shadow-2xl animate-float z-30 w-60 transform rotate-6">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Statistik Ujian</span>
              </div>
              <div className="flex items-end justify-between gap-2 h-16">
                <div className="w-4 bg-emerald-500/50 rounded-t h-[40%]"></div>
                <div className="w-4 bg-emerald-500/70 rounded-t h-[65%]"></div>
                <div className="w-4 bg-emerald-400 rounded-t h-[95%]"></div>
                <div className="w-4 bg-emerald-500/70 rounded-t h-[75%]"></div>
                <div className="w-4 bg-emerald-500/50 rounded-t h-[55%]"></div>
              </div>
            </div>

            {/* Elemen 2: Shield */}
            <div className="absolute bottom-16 left-10 bg-slate-800/80 backdrop-blur-xl border border-slate-600 p-6 rounded-2xl shadow-2xl animate-float-slow z-20 transform -rotate-12">
              <ShieldCheck className="w-14 h-14 text-emerald-400" />
            </div>

            {/* Logo Besar Tengah */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 animate-float">
              <div className="w-28 h-28 rounded-3xl bg-slate-800/80 backdrop-blur-xl border border-slate-600 shadow-[0_0_50px_rgba(52,211,153,0.2)] flex items-center justify-center">
                <Users className="w-14 h-14 text-emerald-400" />
              </div>
            </div>

          </div>
        </div>

      </div>
    </main>
  );
}