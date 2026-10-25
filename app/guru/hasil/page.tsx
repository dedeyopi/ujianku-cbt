"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Trophy, FileText, AlertTriangle, Trash2, Eye, X } from "lucide-react";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { isLoggedIn } from "../../lib/auth";
import { fetchExams, fetchResultsByExam } from "../../lib/db";
import { exportResultsToExcel } from "../../lib/excel";
import { supabase } from "../../lib/supabase";
import type { Exam, ExamResult, Question } from "../../lib/types";

// Fungsi untuk mengecek jawaban (sama seperti di UjianClient)
function isJawabanBenar(q: Question, jawabanSiswa: any): boolean {
  if (jawabanSiswa === undefined || jawabanSiswa === null) return false;
  const normalize = (s: string) => String(s).trim().toLowerCase();
  switch (q.type) {
    case "multiple_choice": return jawabanSiswa === q.correctAnswer;
    case "complex_mc":
      if (!Array.isArray(jawabanSiswa) || !q.correctAnswers) return false;
      if (jawabanSiswa.length !== q.correctAnswers.length) return false;
      return jawabanSiswa.every(ans => q.correctAnswers!.includes(ans));
    case "true_false": return jawabanSiswa === q.trueFalseAnswer;
    case "multi_true_false":
      if (!q.statements) return false;
      return q.statements.every((st, i) => jawabanSiswa[i] === st.isTrue);
    case "matching":
      if (!q.pairs || !jawabanSiswa) return false;
      return q.pairs.every(p => jawabanSiswa[p.left] === p.right);
    case "ordering":
      if (!q.items || !Array.isArray(jawabanSiswa)) return false;
      return q.items.every((item, i) => jawabanSiswa[i] === item);
    case "short_answer":
      const accepted = q.acceptedAnswers || [];
      return accepted.some((a) => normalize(a) === normalize(jawabanSiswa));
    default: return false;
  }
}

export default function HasilUjianPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [results, setResults] = useState<ExamResult[]>([]);
  const [isFetchingResults, setIsFetchingResults] = useState(false);
  
  // State untuk Modal Analisis Jawaban Siswa
  const [selectedResult, setSelectedResult] = useState<ExamResult | null>(null);
  const [activeTab, setActiveTab] = useState<"siswa" | "soal">("siswa");

  useEffect(() => {
    async function init() {
      const loggedIn = await isLoggedIn();
      if (!loggedIn) { router.push("/guru/login"); return; }
      
      const allExams = await fetchExams();
      setExams(allExams);
      
      if (allExams.length > 0) {
        setSelectedExamId(allExams[0].id);
        const initialResults = await fetchResultsByExam(allExams[0].id);
        setResults(initialResults);
      }
      setLoading(false);
    }
    init();
  }, [router]);

  async function handleSelectExam(id: string) {
    setSelectedExamId(id);
    setIsFetchingResults(true);
    const data = await fetchResultsByExam(id);
    setResults(data);
    setIsFetchingResults(false);
  }

  async function handleDeleteResult(id: string, name: string) {
    if (!confirm(`Hapus hasil ujian ${name}? Siswa ini akan bisa mengerjakan ulang.`)) return;
    await supabase.from("results").delete().eq("id", id);
    setResults(results.filter(r => r.id !== id));
  }

  function handleExport() {
    const exam = exams.find((e) => e.id === selectedExamId);
    if (!exam || results.length === 0) return;
    const resultsWithTitle = results.map(r => ({ ...r, examTitle: exam.title }));
    exportResultsToExcel(resultsWithTitle, exam.title);
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p className="text-sm text-slate-500 animate-pulse">Memuat data...</p></div>;
  }

  const selectedExam = exams.find((e) => e.id === selectedExamId);
  const rataRata = results.length > 0 ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length) : 0;

  // Menghitung Analisis Soal (Berapa yang benar per soal)
  const questionAnalysis = selectedExam?.questions.map(q => {
    let correctCount = 0;
    results.forEach(r => {
      if (r.answers && isJawabanBenar(q, r.answers[q.id])) {
        correctCount++;
      }
    });
    return {
      question: q,
      correctCount,
      percentage: results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0
    };
  }) || [];

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.push("/guru")}>
            <ArrowLeft className="w-4 h-4 mr-1.5" />Kembali
          </Button>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-slate-900 text-sm">Hasil Ujian</span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 pt-6">
        {exams.length === 0 ? (
          <Card className="p-12 text-center"><FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Belum ada ujian.</p></Card>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Pilih Ujian</label>
                <select value={selectedExamId} onChange={(e) => handleSelectExam(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition">
                  {exams.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
                </select>
              </div>
              <div className="sm:pt-6">
                <button onClick={handleExport} disabled={results.length === 0 || isFetchingResults} className="inline-flex items-center justify-center font-semibold rounded-xl px-5 py-2.5 text-sm bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm disabled:opacity-50">
                  <Download className="w-4 h-4 mr-1.5" />Export Excel
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-4">
              <button onClick={() => setActiveTab("siswa")} className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${activeTab === "siswa" ? "bg-emerald-100 text-emerald-800" : "text-slate-500 hover:bg-slate-100"}`}>Daftar Nilai Siswa</button>
              <button onClick={() => setActiveTab("soal")} className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${activeTab === "soal" ? "bg-emerald-100 text-emerald-800" : "text-slate-500 hover:bg-slate-100"}`}>Analisis Butir Soal</button>
            </div>

            {isFetchingResults ? (
               <Card className="p-12 text-center"><p className="text-sm text-slate-500 animate-pulse">Mengambil data...</p></Card>
            ) : activeTab === "siswa" ? (
              // TAB 1: DAFTAR NILAI SISWA
              results.length === 0 ? (
                <Card className="p-12 text-center"><Trophy className="w-10 h-10 text-slate-300 mx-auto mb-3" /><p className="font-semibold text-slate-700 mb-1">Belum ada hasil</p><p className="text-sm text-slate-500">Siswa belum mengerjakan ujian ini.</p></Card>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                    <Card className="p-4"><p className="text-xs text-slate-500 mb-1">Total Peserta</p><p className="text-2xl font-bold text-slate-900">{results.length}</p></Card>
                    <Card className="p-4"><p className="text-xs text-slate-500 mb-1">Rata-rata Nilai</p><p className="text-2xl font-bold text-emerald-600">{rataRata}</p></Card>
                    <Card className="p-4"><p className="text-xs text-slate-500 mb-1">Total Pelanggaran</p><p className="text-2xl font-bold text-amber-600">{results.reduce((sum, r) => sum + r.violations, 0)}x</p></Card>
                  </div>

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
                            <th className="px-4 py-3 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {results.map((r) => (
                            <tr key={r.id} className="hover:bg-slate-50/50 transition">
                              <td className="px-4 py-3 font-medium text-slate-900">{r.studentName}</td>
                              <td className="px-4 py-3 text-slate-600">{r.className}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-block px-2.5 py-1 rounded-md font-bold text-xs ${r.score >= 75 ? "bg-emerald-100 text-emerald-700" : r.score >= 60 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>{r.score}</span>
                              </td>
                              <td className="px-4 py-3 text-center text-slate-600">{r.correct} / {r.total}</td>
                              <td className="px-4 py-3 text-center">
                                {r.violations > 0 ? <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded text-xs font-semibold"><AlertTriangle className="w-3 h-3" />{r.violations}x</span> : <span className="text-slate-300">-</span>}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex justify-end gap-1">
                                  <button onClick={() => setSelectedResult(r)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Lihat Jawaban"><Eye className="w-4 h-4" /></button>
                                  <button onClick={() => handleDeleteResult(r.id, r.studentName)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Ulang Ujian (Hapus Nilai)"><Trash2 className="w-4 h-4" /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </>
              )
            ) : (
              // TAB 2: ANALISIS BUTIR SOAL
              <div className="space-y-3">
                {questionAnalysis.map((qa, i) => (
                  <Card key={i} className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 font-bold flex items-center justify-center shrink-0">{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 mb-1 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: qa.question.question }} />
                      <p className="text-xs text-slate-500">Tipe: {qa.question.type.replace("_", " ").toUpperCase()}</p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 bg-slate-50 px-4 py-2 rounded-xl">
                      <div className="text-center">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Benar</p>
                        <p className="font-bold text-slate-900">{qa.correctCount} <span className="text-xs text-slate-400 font-normal">/ {results.length}</span></p>
                      </div>
                      <div className="w-px h-8 bg-slate-200"></div>
                      <div className="text-center">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Persentase</p>
                        <p className={`font-bold ${qa.percentage >= 70 ? 'text-emerald-600' : qa.percentage >= 40 ? 'text-amber-600' : 'text-red-600'}`}>{qa.percentage}%</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL ANALISIS JAWABAN SISWA */}
      {selectedResult && selectedExam && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 sm:p-6">
          <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col animate-fade-in-up">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <div>
                <h3 className="font-bold text-slate-900">Lembar Jawaban: {selectedResult.studentName}</h3>
                <p className="text-xs text-slate-500">Nilai: {selectedResult.score} • Kelas: {selectedResult.className}</p>
              </div>
              <button onClick={() => setSelectedResult(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-4 overflow-y-auto space-y-4 bg-slate-50/50">
              {selectedExam.questions.map((q, i) => {
                const studentAns = selectedResult.answers ? selectedResult.answers[q.id] : undefined;
                const isCorrect = isJawabanBenar(q, studentAns);
                return (
                  <div key={q.id} className="p-4 bg-white border border-slate-200 rounded-xl">
                    <div className="flex gap-3 mb-3">
                      <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{i + 1}</div>
                      <div className="flex-1 font-medium text-slate-900 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: q.question }} />
                    </div>
                    
                    <div className="ml-9 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      {/* KOTAK JAWABAN SISWA */}
                      <div className={`p-3 rounded-lg border ${isCorrect ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                        <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Jawaban Siswa</p>
                        <div className="text-slate-800 prose prose-sm max-w-none">
                          {Array.isArray(studentAns) ? (
                            <ul className="list-disc pl-4">
                              {studentAns.length > 0 ? studentAns.map((a, idx) => <li key={idx} dangerouslySetInnerHTML={{ __html: a }} />) : "Tidak dijawab"}
                            </ul>
                          ) : (
                            <div dangerouslySetInnerHTML={{ __html: String(studentAns || "Tidak dijawab") }} />
                          )}
                        </div>
                      </div>
                      
                      {/* KOTAK KUNCI JAWABAN */}
                      <div className="p-3 rounded-lg border bg-slate-50 border-slate-200">
                        <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Kunci Jawaban</p>
                        <div className="text-slate-800 prose prose-sm max-w-none">
                          {q.type === "complex_mc" ? (
                            q.correctAnswers?.map((a, idx) => <div key={idx} dangerouslySetInnerHTML={{ __html: a }} />)
                          ) : q.type === "true_false" ? (
                            q.trueFalseAnswer ? "Benar" : "Salah"
                          ) : q.type === "short_answer" ? (
                            q.acceptedAnswers?.map((a, idx) => <div key={idx} dangerouslySetInnerHTML={{ __html: a }} />)
                          ) : q.type === "multi_true_false" ? (
                            "Lihat Pernyataan"
                          ) : q.type === "matching" ? (
                            "Lihat Pasangan"
                          ) : q.type === "ordering" ? (
                            q.items?.map((item, idx) => <div key={idx} dangerouslySetInnerHTML={{ __html: item }} />)
                          ) : (
                            <div dangerouslySetInnerHTML={{ __html: q.correctAnswer || "-" }} />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </main>
  );
}