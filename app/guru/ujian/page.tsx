"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit3, Trash2, Copy, FileText, BookOpen, Clock, CheckCircle2, AlertCircle, FileDown } from "lucide-react";
import { fetchExams, removeExam, duplicateExam } from "../../lib/db";
import { isLoggedIn } from "../../lib/auth";
import { exportToWord, exportToPDF } from "../../lib/export-docs"; // Import fungsi export
import type { Exam } from "../../lib/types";

export default function DaftarUjianPage() {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const loggedIn = await isLoggedIn();
      if (!loggedIn) { router.push("/login-guru"); return; }
      const data = await fetchExams();
      setExams(data);
      setLoading(false);
    }
    loadData();
  }, [router]);

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

  if (loading) return <div className="p-8 text-center text-slate-500">Memuat data ujian...</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Daftar Ujian</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola semua jadwal dan paket soal ujian Anda.</p>
        </div>
        <button onClick={() => router.push("/guru/ujian/baru")} className="inline-flex items-center justify-center font-semibold rounded-xl px-5 py-2.5 text-sm bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition">
          <Plus className="w-4 h-4 mr-2" /> Buat Ujian Baru
        </button>
      </div>

      {exams.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700">Belum ada ujian</h3>
          <p className="text-slate-500 text-sm mb-6 mt-1">Mulai dengan membuat ujian pertama Anda.</p>
          <button onClick={() => router.push("/guru/ujian/baru")} className="inline-flex items-center justify-center font-semibold rounded-xl px-5 py-2.5 text-sm bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition">
            <Plus className="w-4 h-4 mr-2" /> Buat Ujian
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {exams.map((exam) => (
            <div key={exam.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <FileText className="w-6 h-6" />
                </div>
                {exam.isActive ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-100">
                    <AlertCircle className="w-3.5 h-3.5" /> Draft
                  </span>
                )}
              </div>
              
              <h3 className="text-lg font-bold text-slate-800 mb-1 line-clamp-2">{exam.title}</h3>
              <p className="text-sm text-slate-500 mb-4">{exam.subject}</p>
              
              <div className="flex items-center gap-4 text-xs font-medium text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl mt-auto">
                <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-slate-400" /> {exam.questions.length} Soal</span>
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-400" /> {Math.floor(exam.duration / 60)} Menit</span>
              </div>

              {/* TOMBOL EXPORT */}
              <div className="flex gap-2 mb-4">
                <button onClick={async () => await exportToPDF(exam)} className="flex-1 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-lg text-xs transition flex items-center justify-center gap-1.5 border border-red-100">
                  <FileDown className="w-3.5 h-3.5" /> PDF
                </button>
                <button onClick={() => exportToWord(exam)} className="flex-1 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold rounded-lg text-xs transition flex items-center justify-center gap-1.5 border border-blue-100">
                  <FileDown className="w-3.5 h-3.5" /> Word
                </button>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-100">
                <button onClick={() => router.push(`/guru/ujian/${exam.id}`)} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-sm transition flex items-center justify-center gap-1.5">
                  <Edit3 className="w-4 h-4" /> Edit
                </button>
                <button onClick={() => handleDuplicate(exam.id)} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition" title="Duplikat">
                  <Copy className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(exam.id, exam.title)} className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition" title="Hapus">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}