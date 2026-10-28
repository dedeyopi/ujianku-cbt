"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, ArrowRight, AlertCircle, User, Sparkles, Lock } from "lucide-react";
import { Card } from "../../components/Card";
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
    <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#0B1120] font-sans">
      {/* Background Glow & Grid */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none translate-y-1/3 translate-x-1/3"></div>
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "40px 40px" }}></div>

      <div className="w-full max-w-md relative animate-fade-in-up z-10">
        {/* Brand */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-white">
              Ujian<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">Ku</span>
            </h1>
          </div>
          <p className="text-slate-400 text-sm font-medium">Jujur dalam ujian, tumbuh dalam proses belajar</p>
        </div>

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700 text-slate-300 text-sm font-semibold backdrop-blur-sm">
            <GraduationCap className="w-4 h-4 text-amber-400" /> Portal Siswa
          </div>
        </div>

        <Card className="p-8 bg-slate-800/80 backdrop-blur-xl border border-slate-700 shadow-2xl rounded-3xl">
          <div className="space-y-5">
            <div>
              <label className="block text-base font-semibold text-slate-300 mb-2">Username</label>
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
              <label className="block text-base font-semibold text-slate-300 mb-2">Kata Sandi</label>
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
        </Card>

        <div className="text-center mt-8">
          <a href="/" className="text-sm font-medium text-slate-500 hover:text-white transition flex items-center justify-center gap-2">
            ← Kembali ke beranda
          </a>
        </div>
      </div>
    </main>
  );
}