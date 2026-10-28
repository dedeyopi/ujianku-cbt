"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, BookOpen, Clock, LogOut, ArrowRight, History, Trophy, CheckCircle2 } from "lucide-react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { fetchExams, fetchStudentResults } from "../lib/db"; 
import { logout } from "../lib/auth";
import { supabase } from "../lib/supabase";
import type { Exam, ExamResult } from "../lib/types";

export default function SiswaPage() {
  const router = useRouter();
  const [student, setStudent] = useState<{ id: string; fullName: string; className: string } | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [history, setHistory] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"tersedia" | "riwayat">("tersedia");

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/siswa/login"); return; }

      const { data: profile } = await supabase.from("users").select("full_name, class_name").eq("id", user.id).single();
      if (profile) setStudent({ id: user.id, fullName: profile.full_name, className: profile.class_name || "-" });

      const allExams = await fetchExams();
      setExams(allExams.filter((e) => e.isActive));

      const studentResults = await fetchStudentResults(user.id);
      setHistory(studentResults);
      
      setLoading(false);
    }
    init();
  }, [router]);

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  if (loading || !student) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p className="text-sm text-slate-500 animate-pulse">Memuat...</p></div>;
  }

  // Cek apakah ujian sudah pernah dikerjakan
  const getResultForExam = (examId: string) => {
    return history.find(h => h.examId === examId);
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 leading-tight">Ujian<span className="text-blue-600">Ku</span></h1>
              <p className="text-xs text-slate-500 leading-tight">Panel Siswa</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}><LogOut className="w-4 h-4 mr-1.5" />Keluar</Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-5 mb-6 bg-gradient-to-br from-blue-500 to-indigo-600 border-0">
          <p className="text-xs text-blue-100 mb-1">Selamat datang,</p>
          <h2 className="text-2xl font-bold text-white">{student.fullName}</h2>
          <p className="text-sm text-blue-100 mt-1">Kelas {student.className}</p>
        </Card>

        <div className="flex gap-2 mb-4">
          <button onClick={() => setActiveTab("tersedia")} className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${activeTab === "tersedia" ? "bg-blue-100 text-blue-800" : "text-slate-500 hover:bg-slate-100"}`}>Ujian Tersedia</button>
          <button onClick={() => setActiveTab("riwayat")} className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${activeTab === "riwayat" ? "bg-blue-100 text-blue-800" : "text-slate-500 hover:bg-slate-100"}`}>Riwayat Nilai</button>
        </div>

        {activeTab === "tersedia" ? (
          exams.length === 0 ? (
            <Card className="p-12 text-center">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-700 mb-1">Belum ada ujian aktif</p>
              <p className="text-sm text-slate-500">Tunggu guru Anda mengaktifkan ujian.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exams.map((exam) => {
                const existingResult = getResultForExam(exam.id);
                return (
                  <Card key={exam.id} className={`p-5 ${existingResult ? 'bg-slate-50 opacity-90' : ''}`}>
                    <h4 className="font-semibold text-slate-900 mb-1 truncate">{exam.title}</h4>
                    <p className="text-xs text-slate-500 mb-3">{exam.subject}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                      <span className="inline-flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{exam.questions.length} soal</span>
                      <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{Math.floor(exam.duration / 60)} menit</span>
                    </div>
                    {existingResult ? (
                      <div className="w-full py-2 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm border border-emerald-100">
                        <CheckCircle2 className="w-4 h-4" /> Selesai (Nilai: {existingResult.score})
                      </div>
                    ) : (
                      <Button onClick={() => router.push(`/ujian/${exam.id}`)} size="sm" className="w-full">
                        Mulai Ujian <ArrowRight className="w-4 h-4 ml-1.5" />
                      </Button>
                    )}
                  </Card>
                );
              })}
            </div>
          )
        ) : (
          history.length === 0 ? (
            <Card className="p-12 text-center">
              <History className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-700 mb-1">Belum ada riwayat</p>
              <p className="text-sm text-slate-500">Anda belum pernah mengerjakan ujian.</p>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Nama Ujian</th>
                      <th className="px-4 py-3 text-center">Tanggal</th>
                      <th className="px-4 py-3 text-center">Nilai</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {history.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-4 py-3 font-medium text-slate-900">{h.examTitle}</td>
                        <td className="px-4 py-3 text-center text-slate-500">{new Date(h.submittedAt).toLocaleDateString("id-ID")}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-md font-bold text-xs ${h.score >= 75 ? "bg-emerald-100 text-emerald-700" : h.score >= 60 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>{h.score}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )
        )}
      </div>
    </main>
  );
}