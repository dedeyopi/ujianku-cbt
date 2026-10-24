"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, ArrowRight, AlertCircle, User, Sparkles } from "lucide-react";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Input } from "../../components/Input";
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
    <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
      <div className="absolute top-[-100px] left-[-100px] w-80 h-80 rounded-full bg-blue-500/20 blur-3xl"></div>
      <div className="absolute bottom-[-120px] right-[-80px] w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl"></div>

      <div className="w-full max-w-md relative animate-fade-in-up">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2.5 mb-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Ujian<span className="text-blue-400">Ku</span></h1>
          </div>
          <p className="text-blue-200/60 text-xs font-medium">Jujur dalam ujian, tumbuh dalam proses belajar</p>
        </div>

        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white text-xs font-semibold">
            <GraduationCap className="w-3.5 h-3.5" /> Masuk Siswa
          </div>
        </div>

        <Card className="p-6 backdrop-blur-sm bg-white/95">
          <div className="space-y-4">
            <div className="relative">
              <Input
                id="username"
                label="Username"
                placeholder="Masukkan username"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                autoFocus
                disabled={loading}
              />
              <User className="w-4 h-4 text-slate-300 absolute right-3 top-10 pointer-events-none" />
            </div>

            <Input
              id="password"
              label="Kata Sandi"
              type="password"
              placeholder="Masukkan kata sandi"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 mt-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          <Button onClick={handleLogin} size="lg" className="w-full mt-5" disabled={loading}>
            {loading ? "Memeriksa..." : "Masuk"} <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Card>

        <div className="text-center mt-6">
          <a href="/" className="text-xs text-blue-200/70 hover:text-white transition">← Kembali ke beranda</a>
        </div>
      </div>
    </main>
  );
}