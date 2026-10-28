"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, LogOut, FileText, Clock, BookOpen, TrendingUp, Trash2, Edit3, Users, Trophy, Copy, MonitorPlay, BookMarked
} from "lucide-react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Logo } from "../components/Logo";
import { fetchExams, removeExam, duplicateExam } from "../lib/db";
import { isLoggedIn, logout } from "../lib/auth"; 
import type { Exam } from "../lib/types";

export default function DashboardGuruPage() {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    async function checkAuthAndFetch() {
      const loggedIn = await isLoggedIn();
      if (!loggedIn) { router.push("/guru/login"); return; }
      const data = await fetchExams();
      setExams(data);
      setLoading(false);
      setIsCheckingAuth(false);
    }
    checkAuthAndFetch();
  }, [router]);

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Hapus ujian "${title}"?`)) return;
    const success = await removeExam(id);
    if (success) setExams(await fetchExams());
    else alert("Gagal menghapus.");
  }

  async function handleDuplicate(id: string) {
    if (!confirm("Duplikat ujian ini? (Status akan menjadi Draft)")) return;
    const success = await duplicateExam(id);
    if (success) {
      alert("Ujian berhasil diduplikat!");
      setExams(await fetchExams());
    } else {
      alert("Gagal menduplikat ujian.");
    }
  }

  if (loading || isCheckingAuth) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p className="text-sm text-slate-500 animate-pulse">Memuat data...</p></div>;
  }

  const totalSoal = exams.reduce((sum, e) => sum + e.questions.length, 0);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo className="w-10 h-10" />
            <div>
              <h1 className="font-bold text-slate-900 leading-tight">Ujian<span className="text-emerald-600">Ku</span></h1>
              <p className="text-xs text-slate-500 leading-tight">Panel Guru</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="secondary" size="sm" onClick={() => router.push("/guru/bank-soal")}>
              <BookMarked className="w-4 h-4 mr-1.5" />Bank Soal
            </Button>
            <Button variant="secondary" size="sm" onClick={() => router.push("/guru/pantau")}>
              <MonitorPlay className="w-4 h-4 mr-1.5" />Pantau
            </Button>
            <Button variant="secondary" size="sm" onClick={() => router.push("/guru/hasil")}>
              <Trophy className="w-4 h-4 mr-1.5" />Hasil
            </Button>
            <Button variant="secondary" size="sm" onClick={() => router.push("/guru/siswa")}>
              <Users className="w-4 h-4 mr-1.5" />Siswa
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-1.5" />Keluar
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-5"><div className="flex items-center justify-between"><div><p className="text-xs text-slate-500 mb-1">Total Ujian</p><p className="text-3xl font-bold text-slate-900">{exams.length}</p></div><div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><FileText className="w-5 h-5 text-emerald-600" /></div></div></Card>
          <Card className="p-5"><div className="flex items-center justify-between"><div><p className="text-xs text-slate-500 mb-1">Total Soal</p><p className="text-3xl font-bold text-slate-900">{totalSoal}</p></div><div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center"><BookOpen className="w-5 h-5 text-teal-600" /></div></div></Card>
          <Card className="p-5"><div className="flex items-center justify-between"><div><p className="text-xs text-slate-500 mb-1">Status</p><p className="text-3xl font-bold text-slate-900">{exams.length === 0 ? "Kosong" : exams.some((e) => e.isActive) ? "Aktif" : "Draft"}</p></div><div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-amber-600" /></div></div></Card>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div><h2 className="text-xl font-bold text-slate-900">Daftar Ujian</h2><p className="text-sm text-slate-500">Kelola ujian yang tersimpan di server</p></div>
          <button onClick={() => router.push("/guru/ujian/baru")} className="inline-flex items-center justify-center font-semibold rounded-xl px-5 py-2.5 text-sm bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"><Plus className="w-4 h-4 mr-1.5" />Buat Ujian</button>
        </div>

        {exams.length === 0 ? (
          <Card className="p-12 text-center"><FileText className="w-7 h-7 text-emerald-400 mx-auto mb-3" /><h3 className="font-semibold text-slate-700 mb-1">Belum ada ujian</h3><p className="text-sm text-slate-500 mb-5">Mulai dengan membuat ujian pertama Anda</p><button onClick={() => router.push("/guru/ujian/baru")} className="inline-flex items-center justify-center font-semibold rounded-xl px-5 py-2.5 text-sm bg-emerald-600 text-white hover:bg-emerald-700"><Plus className="w-4 h-4 mr-1.5" />Buat Ujian Baru</button></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exams.map((exam) => (
              <Card key={exam.id} className="p-5 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{exam.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{exam.subject}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${exam.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{exam.isActive ? "Aktif" : "Draft"}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                  <span className="inline-flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{exam.questions.length} soal</span>
                  <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{Math.floor(exam.duration / 60)} menit</span>
                </div>
                <div className="flex gap-2 pt-3 border-t border-slate-100">
                  <Button variant="secondary" size="sm" className="flex-1 hover:border-emerald-300 hover:text-emerald-700" onClick={() => router.push(`/guru/ujian/${exam.id}`)}><Edit3 className="w-3.5 h-3.5 mr-1" />Edit</Button>
                  <Button variant="secondary" size="sm" onClick={() => handleDuplicate(exam.id)} title="Duplikat"><Copy className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(exam.id, exam.title)} className="text-red-600 hover:bg-red-50" title="Hapus"><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </Card>
            ))}
          </div>
        )}
        <p className="text-xs text-slate-400 text-center mt-8">Data tersimpan aman di Supabase Cloud.</p>
      </div>
    </main>
  );
}