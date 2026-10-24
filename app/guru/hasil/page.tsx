"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Trophy,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { isTeacherLoggedIn, getExams } from "../../lib/storage";
import { getResults, getResultsByExam } from "../../lib/results";
import { exportResultsToExcel } from "../../lib/excel";
import type { Exam, ExamResult } from "../../lib/types";

export default function HasilUjianPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [results, setResults] = useState<ExamResult[]>([]);

  useEffect(() => {
    if (!isTeacherLoggedIn()) {
      router.push("/guru/login");
      return;
    }
    
    const allExams = getExams();
    setExams(allExams);
    
    if (allExams.length > 0) {
      setSelectedExamId(allExams[0].id);
      setResults(getResultsByExam(allExams[0].id));
    } else {
      setResults([]);
    }
    setLoading(false);
  }, [router]);

  function handleSelectExam(id: string) {
    setSelectedExamId(id);
    setResults(getResultsByExam(id));
  }

  function handleExport() {
    const exam = exams.find((e) => e.id === selectedExamId);
    if (!exam || results.length === 0) return;
    exportResultsToExcel(results, exam.title);
  }

  if (loading) return null;

  const selectedExam = exams.find((e) => e.id === selectedExamId);
  const rataRata = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
    : 0;

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.push("/guru")}>
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Kembali
          </Button>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-slate-900 text-sm">
              Hasil Ujian
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 pt-6">
        {exams.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Belum ada ujian yang dibuat.</p>
          </Card>
        ) : (
          <>
            {/* Filter & Aksi */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Pilih Ujian
                </label>
                <select
                  value={selectedExamId}
                  onChange={(e) => handleSelectExam(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition"
                >
                  {exams.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="sm:pt-6">
                <button
                  onClick={handleExport}
                  disabled={results.length === 0}
                  className="inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] px-5 py-2.5 text-sm bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4 mr-1.5" />
                  Export Excel
                </button>
              </div>
            </div>

            {/* Statistik Singkat */}
            {results.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                <Card className="p-4">
                  <p className="text-xs text-slate-500 mb-1">Total Peserta</p>
                  <p className="text-2xl font-bold text-slate-900">{results.length}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-slate-500 mb-1">Rata-rata Nilai</p>
                  <p className="text-2xl font-bold text-emerald-600">{rataRata}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-slate-500 mb-1">Total Pelanggaran</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {results.reduce((sum, r) => sum + r.violations, 0)}x
                  </p>
                </Card>
              </div>
            )}

            {/* Tabel Hasil */}
            {results.length === 0 ? (
              <Card className="p-12 text-center">
                <Trophy className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="font-semibold text-slate-700 mb-1">Belum ada hasil</p>
                <p className="text-sm text-slate-500">
                  Siswa belum mengerjakan ujian ini.
                </p>
              </Card>
            ) : (
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Nama Siswa</th>
                        <th className="px-4 py-3">Kelas</th>
                        <th className="px-4 py-3 text-center">Nilai</th>
                        <th className="px-4 py-3 text-center">Benar</th>
                        <th className="px-4 py-3 text-center">Pelanggaran</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {results.sort((a, b) => b.score - a.score).map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/50 transition">
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {r.studentName}
                          </td>
                          <td className="px-4 py-3 text-slate-600">{r.className}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-block px-2.5 py-1 rounded-md font-bold text-xs ${
                              r.score >= 75 
                                ? "bg-emerald-100 text-emerald-700" 
                                : r.score >= 60
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                            }`}>
                              {r.score}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-slate-600">
                            {r.correct} / {r.total}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {r.violations > 0 ? (
                              <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded text-xs font-semibold">
                                <AlertTriangle className="w-3 h-3" />
                                {r.violations}x
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </main>
  );
}