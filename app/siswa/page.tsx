"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, BookOpen, Clock, LogOut, ArrowRight } from "lucide-react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { fetchExams } from "../lib/db"; // Ambil dari Supabase
import { logout } from "../lib/auth";
import { supabase } from "../lib/supabase";
import type { Exam } from "../lib/types";

export default function SiswaPage() {
  const router = useRouter();
  const [student, setStudent] = useState<{ id: string; fullName: string; className: string } | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      // Cek sesi Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/siswa/login");
        return;
      }

      // Ambil profil siswa
      const { data: profile } = await supabase
        .from("users")
        .select("full_name, class_name")
        .eq("id", user.id)
        .single();

      if (profile) {
        setStudent({
          id: user.id,
          fullName: profile.full_name,
          className: profile.class_name || "-",
        });
      }

      // Ambil ujian yang aktif dari Supabase
      const allExams = await fetchExams();
      setExams(allExams.filter((e) => e.isActive));
      
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

  return (
    <main className="min-h-screen bg-slate-50">
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

        <div className="mb-4">
          <h3 className="text-lg font-bold text-slate-900">Ujian Tersedia</h3>
          <p className="text-sm text-slate-500">Pilih ujian di bawah untuk mulai mengerjakan</p>
        </div>

        {exams.length === 0 ? (
          <Card className="p-12 text-center">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700 mb-1">Belum ada ujian aktif</p>
            <p className="text-sm text-slate-500">Tunggu guru Anda mengaktifkan ujian.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exams.map((exam) => (
              <Card key={exam.id} className="p-5">
                <h4 className="font-semibold text-slate-900 mb-1 truncate">{exam.title}</h4>
                <p className="text-xs text-slate-500 mb-3">{exam.subject}</p>
                <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                  <span className="inline-flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{exam.questions.length} soal</span>
                  <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{Math.floor(exam.duration / 60)} menit</span>
                </div>
                <Button onClick={() => router.push(`/ujian/${exam.id}`)} size="sm" className="w-full">
                  Mulai Ujian <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}