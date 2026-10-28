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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter text-white leading-tight">
                Ujian<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">Ku</span>
              </h1>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Portal Siswa</p>
            </div>
          </div>
          <button onClick={handleLogout} className="text-sm font-semibold text-slate-400 hover:text-white transition flex items-center gap-2 bg-slate-800/50 hover:bg-slate-800 px-4 py-2 rounded-xl border border-slate-700/50">
            <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 pt-8 relative z-10">
        
        {/* Kartu Sambutan (Ukuran font nama diturunkan) */}
        <div className="p-8 mb-8 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-2xl rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <p className="text-sm sm:text-base font-medium text-slate-400 mb-2">Selamat datang kembali,</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3">{student.fullName}</h2>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-400/10 border border-amber-400/20 text-amber-400 text-sm font-bold">
            <GraduationCap className="w-4 h-4" /> Kelas {student.className}
          </div>
        </div>

        {/* Tab Navigasi */}
        <div className="flex gap-2 mb-6 bg-slate-900/50 p-1.5 rounded-xl w-fit border border-slate-800">
          <button 
            onClick={() => setActiveTab("tersedia")} 
            className={`px-5 py-2.5 text-sm sm:text-base font-bold rounded-lg transition-all ${activeTab === "tersedia" ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-white hover:bg-slate-800/50"}`}
          >
            Ujian Tersedia
          </button>
          <button 
            onClick={() => setActiveTab("riwayat")} 
            className={`px-5 py-2.5 text-sm sm:text-base font-bold rounded-lg transition-all ${activeTab === "riwayat" ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-white hover:bg-slate-800/50"}`}
          >
            Riwayat Nilai
          </button>
        </div>

        {/* Konten Tab */}
        {activeTab === "tersedia" ? (
          exams.length === 0 ? (
            <div className="p-12 text-center bg-slate-800/50 border border-slate-700 rounded-3xl">
              <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-lg font-bold text-slate-300 mb-1">Belum ada ujian aktif</p>
              <p className="text-sm text-slate-400">Tunggu guru Anda mengaktifkan ujian.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {exams.map((exam) => {
                const existingResult = getResultForExam(exam.id);
                return (
                  <div key={exam.id} className={`p-6 bg-slate-800 backdrop-blur-sm border border-slate-700 rounded-2xl shadow-lg transition-all duration-200 flex flex-col ${existingResult ? 'opacity-80' : 'hover:border-slate-500 hover:shadow-2xl hover:-translate-y-1'}`}>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-white mb-1 leading-snug">{exam.title}</h4>
                      <p className="text-sm font-medium text-slate-300 mb-5">{exam.subject}</p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300 mb-6 bg-slate-900/80 p-3 rounded-xl border border-slate-700">
                        <span className="inline-flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-blue-400" /> {exam.questions.length} Soal</span>
                        <span className="inline-flex items-center gap-1.5"><Clock className="w-4 h-4 text-emerald-400" /> {Math.floor(exam.duration / 60)} Menit</span>
                        {exam.token && <span className="inline-flex items-center gap-1.5 text-amber-400 font-semibold"><Key className="w-4 h-4" /> Pakai Token</span>}
                      </div>
                    </div>
                    
                    {existingResult ? (
                      <div className="w-full py-3 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center gap-2 font-bold text-base border border-emerald-500/20">
                        <CheckCircle2 className="w-5 h-5" /> Selesai (Nilai: {existingResult.score})
                      </div>
                    ) : (
                      <button onClick={() => handleMulaiUjian(exam)} className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-xl font-bold text-base transition-all shadow-[0_0_15px_rgba(251,191,36,0.2)] hover:shadow-[0_0_25px_rgba(251,191,36,0.4)] flex items-center justify-center gap-2">
                        Mulai Ujian <ArrowRight className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )
        ) : (
          history.length === 0 ? (
            <div className="p-12 text-center bg-slate-800/50 border border-slate-700 rounded-3xl">
              <History className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-lg font-bold text-slate-300 mb-1">Belum ada riwayat</p>
              <p className="text-sm text-slate-400">Anda belum pernah mengerjakan ujian.</p>
            </div>
          ) : (
            <div className="overflow-hidden bg-slate-800 border border-slate-700 rounded-2xl shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-900 border-b border-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Nama Ujian</th>
                      <th className="px-6 py-4 text-center">Tanggal</th>
                      <th className="px-6 py-4 text-center">Nilai Akhir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {history.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-700/50 transition">
                        <td className="px-6 py-4 font-bold text-white text-base">{h.examTitle}</td>
                        <td className="px-6 py-4 text-center text-slate-300 font-medium">{new Date(h.submittedAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center justify-center w-12 h-10 rounded-lg font-black text-lg ${h.score >= 75 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : h.score >= 60 ? "bg-amber-400/20 text-amber-400 border border-amber-400/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
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
          <div className="w-full max-w-sm p-8 text-center animate-fade-in-up bg-slate-800 border border-slate-700 shadow-2xl rounded-3xl">
            <div className="w-16 h-16 bg-slate-900 border border-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">
              <Key className="w-8 h-8 text-amber-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Masukkan Token</h3>
            <p className="text-sm text-slate-400 mb-6">Tanyakan token kepada guru Anda.</p>
            
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
              placeholder="X X X X X X"
              className="w-full text-center text-3xl font-mono tracking-widest uppercase px-4 py-4 bg-slate-900/50 border-2 border-slate-600 rounded-xl text-white focus:outline-none focus:border-amber-400 mb-6 transition"
              maxLength={10}
              autoFocus
            />
            
            <div className="flex gap-3">
              <button onClick={() => setTokenModalOpen(false)} className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold text-base rounded-xl transition">Batal</button>
              <button onClick={submitToken} className="flex-1 py-3 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-base rounded-xl transition shadow-[0_0_15px_rgba(251,191,36,0.2)]">Masuk</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}