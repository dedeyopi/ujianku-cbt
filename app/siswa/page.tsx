"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  GraduationCap, BookOpen, Clock, LogOut, ArrowRight, History, 
  Trophy, CheckCircle2, Key, Sparkles 
} from "lucide-react";
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

  // State untuk modal token
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [selectedExamForToken, setSelectedExamForToken] = useState<Exam | null>(null);
  const [tokenInput, setTokenInput] = useState("");

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

  function handleMulaiUjian(exam: Exam) {
    const now = new Date().getTime();
    if (exam.startTime && now < new Date(exam.startTime).getTime()) {
      alert("Ujian belum dimulai. Tunggu instruksi guru.");
      return;
    }
    if (exam.endTime && now > new Date(exam.endTime).getTime()) {
      alert("Waktu ujian sudah habis.");
      return;
    }

    if (exam.token && exam.token.trim() !== "") {
      setSelectedExamForToken(exam);
      setTokenInput("");
      setTokenModalOpen(true);
    } else {
      router.push(`/ujian/${exam.id}`);
    }
  }

  function submitToken() {
    if (tokenInput === selectedExamForToken?.token) {
      router.push(`/ujian/${selectedExamForToken.id}`);
    } else {
      alert("Token salah! Silakan coba lagi.");
    }
  }

  if (loading || !student) {
    return <div className="min-h-screen flex items-center justify-center bg-[#0B1120]"><p className="text-base text-slate-400 animate-pulse">Memuat data...</p></div>;
  }

  const getResultForExam = (examId: string) => {
    return history.find(h => h.examId === examId);
  };

  return (
    <main className="min-h-screen bg-[#0B1120] pb-20 relative overflow-hidden font-sans">
      
      {/* Background Efek Cahaya */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none translate-y-1/3 -translate-x-1/3"></div>

      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-white leading-tight">
                Ujian<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">Ku</span>
              </h1>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Portal Siswa</p>
            </div>
          </div>
          <button onClick={handleLogout} className="text-base font-semibold text-slate-400 hover:text-white transition flex items-center gap-2 bg-slate-800/50 hover:bg-slate-800 px-5 py-2.5 rounded-xl border border-slate-700/50">
            <LogOut className="w-5 h-5" /> <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 pt-10 relative z-10">
        
        {/* Kartu Sambutan (Welcome Card) - Menggunakan div biasa agar tidak bentrok dengan bg-white bawaan Card */}
        <div className="p-10 mb-10 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-2xl rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <p className="text-lg font-medium text-slate-400 mb-2">Selamat datang kembali,</p>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">{student.fullName}</h2>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-400/10 border border-amber-400/20 text-amber-400 text-base font-bold">
            <GraduationCap className="w-5 h-5" /> Kelas {student.className}
          </div>
        </div>

        {/* Tab Navigasi */}
        <div className="flex gap-2 mb-8 bg-slate-900/50 p-2 rounded-2xl w-fit border border-slate-800">
          <button 
            onClick={() => setActiveTab("tersedia")} 
            className={`px-8 py-3 text-base font-bold rounded-xl transition-all ${activeTab === "tersedia" ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-white hover:bg-slate-800/50"}`}
          >
            Ujian Tersedia
          </button>
          <button 
            onClick={() => setActiveTab("riwayat")} 
            className={`px-8 py-3 text-base font-bold rounded-xl transition-all ${activeTab === "riwayat" ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-white hover:bg-slate-800/50"}`}
          >
            Riwayat Nilai
          </button>
        </div>

        {/* Konten Tab */}
        {activeTab === "tersedia" ? (
          exams.length === 0 ? (
            <div className="p-16 text-center bg-slate-800/50 border border-slate-700 rounded-3xl">
              <BookOpen className="w-14 h-14 text-slate-600 mx-auto mb-4" />
              <p className="text-2xl font-bold text-slate-300 mb-2">Belum ada ujian aktif</p>
              <p className="text-base text-slate-400">Tunggu guru Anda mengaktifkan ujian.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {exams.map((exam) => {
                const existingResult = getResultForExam(exam.id);
                return (
                  // Menggunakan div biasa untuk menjamin background gelap
                  <div key={exam.id} className={`p-8 bg-slate-800 backdrop-blur-sm border border-slate-700 rounded-3xl shadow-lg transition-all duration-200 flex flex-col ${existingResult ? 'opacity-80' : 'hover:border-slate-500 hover:shadow-2xl hover:-translate-y-1'}`}>
                    <div className="flex-1">
                      <h4 className="text-2xl font-bold text-white mb-2">{exam.title}</h4>
                      {/* Warna teks mapel dibuat lebih terang (slate-300) agar kontras dengan latar gelap */}
                      <p className="text-base font-medium text-slate-300 mb-6">{exam.subject}</p>
                      
                      <div className="flex flex-wrap items-center gap-5 text-base text-slate-300 mb-8 bg-slate-900/80 p-4 rounded-xl border border-slate-700">
                        <span className="inline-flex items-center gap-2"><BookOpen className="w-5 h-5 text-blue-400" /> {exam.questions.length} Soal</span>
                        <span className="inline-flex items-center gap-2"><Clock className="w-5 h-5 text-emerald-400" /> {Math.floor(exam.duration / 60)} Menit</span>
                        {exam.token && <span className="inline-flex items-center gap-2 text-amber-400 font-semibold"><Key className="w-5 h-5" /> Pakai Token</span>}
                      </div>
                    </div>
                    
                    {existingResult ? (
                      <div className="w-full py-4 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center gap-2 font-bold text-lg border border-emerald-500/20">
                        <CheckCircle2 className="w-6 h-6" /> Selesai (Nilai: {existingResult.score})
                      </div>
                    ) : (
                      <button onClick={() => handleMulaiUjian(exam)} className="w-full py-4 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-xl font-bold text-lg transition-all shadow-[0_0_15px_rgba(251,191,36,0.2)] hover:shadow-[0_0_25px_rgba(251,191,36,0.4)] flex items-center justify-center gap-2">
                        Mulai Ujian <ArrowRight className="w-6 h-6" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )
        ) : (
          history.length === 0 ? (
            <div className="p-16 text-center bg-slate-800/50 border border-slate-700 rounded-3xl">
              <History className="w-14 h-14 text-slate-600 mx-auto mb-4" />
              <p className="text-2xl font-bold text-slate-300 mb-2">Belum ada riwayat</p>
              <p className="text-base text-slate-400">Anda belum pernah mengerjakan ujian.</p>
            </div>
          ) : (
            <div className="overflow-hidden bg-slate-800 border border-slate-700 rounded-3xl shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-base text-left">
                  <thead className="bg-slate-900 border-b border-slate-700 text-slate-300 font-bold text-sm uppercase tracking-wider">
                    <tr>
                      <th className="px-8 py-5">Nama Ujian</th>
                      <th className="px-8 py-5 text-center">Tanggal</th>
                      <th className="px-8 py-5 text-center">Nilai Akhir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {history.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-700/50 transition">
                        <td className="px-8 py-5 font-bold text-white text-lg">{h.examTitle}</td>
                        <td className="px-8 py-5 text-center text-slate-300 font-medium">{new Date(h.submittedAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td className="px-8 py-5 text-center">
                          <span className={`inline-flex items-center justify-center w-14 h-12 rounded-xl font-black text-xl ${h.score >= 75 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : h.score >= 60 ? "bg-amber-400/20 text-amber-400 border border-amber-400/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
                            {h.score}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
      </div>

      {/* MODAL TOKEN */}
      {tokenModalOpen && selectedExamForToken && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md p-10 text-center animate-fade-in-up bg-slate-800 border border-slate-700 shadow-2xl rounded-3xl">
            <div className="w-20 h-20 bg-slate-900 border border-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Key className="w-10 h-10 text-amber-400" />
            </div>
            <h3 className="text-3xl font-bold text-white mb-3">Masukkan Token</h3>
            <p className="text-base text-slate-400 mb-8">Tanyakan 6 karakter token kepada guru Anda.</p>
            
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
              placeholder="X X X X X X"
              className="w-full text-center text-4xl font-mono tracking-widest uppercase px-4 py-5 bg-slate-900/50 border-2 border-slate-600 rounded-2xl text-white focus:outline-none focus:border-amber-400 mb-8 transition"
              maxLength={10}
              autoFocus
            />
            
            <div className="flex gap-4">
              <button onClick={() => setTokenModalOpen(false)} className="flex-1 py-4 bg-slate-700 hover:bg-slate-600 text-white font-bold text-lg rounded-xl transition">Batal</button>
              <button onClick={submitToken} className="flex-1 py-4 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-lg rounded-xl transition shadow-[0_0_15px_rgba(251,191,36,0.2)]">Masuk</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}