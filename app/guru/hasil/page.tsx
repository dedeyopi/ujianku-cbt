"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Trophy, FileText, AlertTriangle, Trash2, Eye, X, RefreshCw, Save, BarChart2 } from "lucide-react";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { isLoggedIn } from "../../lib/auth";
import { fetchExams, fetchResultsByExam, updateResultGrades } from "../../lib/db";
import { exportResultsToExcel, exportQuestionAnalysisToExcel } from "../../lib/excel";
import { supabase } from "../../lib/supabase";
import type { Exam, ExamResult, Question } from "../../lib/types";

// Import Komponen Recharts
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [selectedResult, setSelectedResult] = useState<ExamResult | null>(null);
  const [activeTab, setActiveTab] = useState<"siswa" | "soal" | "grafik">("siswa");
  
  const [essayScores, setEssayScores] = useState<Record<string, number>>({});
  const [isSavingGrades, setIsSavingGrades] = useState(false);
  const [filterClass, setFilterClass] = useState("Semua");

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

  useEffect(() => {
    if (selectedResult) {
      setEssayScores(selectedResult.manualGrades || {});
    }
  }, [selectedResult]);

  async function handleSelectExam(id: string) {
    setSelectedExamId(id);
    setIsFetchingResults(true);
    setFilterClass("Semua");
    const data = await fetchResultsByExam(id);
    setResults(data);
    setIsFetchingResults(false);
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    const data = await fetchResultsByExam(selectedExamId);
    setResults(data);
    setIsRefreshing(false);
  }

  async function handleDeleteResult(id: string, name: string) {
    if (!confirm(`Hapus hasil ujian ${name}? Siswa ini akan bisa mengerjakan ulang.`)) return;
    const { error } = await supabase.from("results").delete().eq("id", id);
    if (error) { alert(`Gagal menghapus: ${error.message}`); return; }
    setResults(results.filter(r => r.id !== id));
  }

  const availableClasses = useMemo(() => {
    const classes = new Set(results.map(r => r.className).filter(Boolean));
    return ["Semua", ...Array.from(classes).sort()];
  }, [results]);

  const filteredResults = results.filter(r => 
    filterClass === "Semua" ? true : r.className === filterClass
  );

  function handleExport() {
    const exam = exams.find((e) => e.id === selectedExamId);
    if (!exam) return;
    
    if (activeTab === "siswa") {
      if (filteredResults.length === 0) return alert("Belum ada data untuk diekspor.");
      exportResultsToExcel(filteredResults.map(r => ({ ...r, examTitle: exam.title })), exam.title);
    } else {
      const qAnalysis = getQuestionAnalysis();
      if (qAnalysis.length === 0) return alert("Belum ada data analisis.");
      exportQuestionAnalysisToExcel(qAnalysis, exam.title, filteredResults.length);
    }
  }

  async function handleSaveEssayGrades() {
    if (!selectedResult || !selectedExam) return;
    
    let correctAuto = 0;
    selectedExam.questions.forEach(q => {
      if (q.type !== "essay" && selectedResult.answers && isJawabanBenar(q, selectedResult.answers[q.id])) {
        correctAuto++;
      }
    });

    let essayContribution = 0;
    Object.values(essayScores).forEach(score => {
      essayContribution += (score / 100);
    });

    const totalPoinDidapat = correctAuto + essayContribution;
    const totalSoal = selectedExam.questions.length;
    const nilaiBaru = Math.round((totalPoinDidapat / totalSoal) * 100);

    setIsSavingGrades(true);
    const success = await updateResultGrades(selectedResult.id, nilaiBaru, essayScores);
    
    if (success) {
      alert("Nilai esai berhasil disimpan!");
      setSelectedResult(null);
      handleRefresh();
    } else {
      alert("Gagal menyimpan nilai. Coba lagi.");
    }
    setIsSavingGrades(false);
  }

  const getQuestionAnalysis = () => {
    const selectedExam = exams.find((e) => e.id === selectedExamId);
    if (!selectedExam) return [];
    return selectedExam.questions.map(q => {
      let correctCount = 0;
      filteredResults.forEach(r => {
        if (r.answers && isJawabanBenar(q, r.answers[q.id])) correctCount++;
      });
      const percentage = filteredResults.length > 0 ? Math.round((correctCount / filteredResults.length) * 100) : 0;
      
      let kategori = "Sedang"; let badgeClass = "bg-amber-100 text-amber-700";
      if (q.type === "essay") { kategori = "Manual"; badgeClass = "bg-blue-100 text-blue-700"; }
      else if (percentage >= 70) { kategori = "Mudah"; badgeClass = "bg-emerald-100 text-emerald-700"; }
      else if (percentage < 30) { kategori = "Sulit"; badgeClass = "bg-red-100 text-red-700"; }

      return { question: q, correctCount, percentage, kategori, badgeClass };
    });
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p className="text-sm text-slate-500 animate-pulse">Memuat data...</p></div>;
  }

  const selectedExam = exams.find((e) => e.id === selectedExamId);
  const rataRata = filteredResults.length > 0 ? Math.round(filteredResults.reduce((sum, r) => sum + r.score, 0) / filteredResults.length) : 0;
  const questionAnalysis = getQuestionAnalysis();

  // --- PERSIAPAN DATA UNTUK GRAFIK ---
  // 1. Data Distribusi Nilai
  const scoreRanges = [
    { name: "0-59", count: 0 },
    { name: "60-69", count: 0 },
    { name: "70-79", count: 0 },
    { name: "80-89", count: 0 },
    { name: "90-100", count: 0 },
  ];
  filteredResults.forEach(r => {
    if (r.score < 60) scoreRanges[0].count++;
    else if (r.score < 70) scoreRanges[1].count++;
    else if (r.score < 80) scoreRanges[2].count++;
    else if (r.score < 90) scoreRanges[3].count++;
    else scoreRanges[4].count++;
  });

  // 2. Data Tingkat Kesukaran
  let mudah = 0, sedang = 0, sulit = 0, manual = 0;
  questionAnalysis.forEach(qa => {
    if (qa.kategori === "Mudah") mudah++;
    else if (qa.kategori === "Sedang") sedang++;
    else if (qa.kategori === "Sulit") sulit++;
    else manual++;
  });
  const difficultyData = [
    { name: "Mudah", value: mudah, color: "#10b981" }, // Emerald
    { name: "Sedang", value: sedang, color: "#f59e0b" }, // Amber
    { name: "Sulit", value: sulit, color: "#ef4444" }, // Red
  ].filter(d => d.value > 0); // Hanya tampilkan yang ada datanya

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
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Pilih Ujian</label>
                <select value={selectedExamId} onChange={(e) => handleSelectExam(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition">
                  {exams.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
                </select>
              </div>
              
              <div className="lg:pt-6 flex flex-wrap items-center gap-2">
                <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 font-medium">
                  {availableClasses.map(c => <option key={c} value={c}>{c === "Semua" ? "Semua Kelas" : `Kelas ${c}`}</option>)}
                </select>

                <button onClick={handleRefresh} disabled={isRefreshing} className="inline-flex items-center justify-center font-semibold rounded-xl px-4 py-2.5 text-sm bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm disabled:opacity-50 transition">
                  <RefreshCw className={`w-4 h-4 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />{isRefreshing ? "Memuat..." : "Refresh"}
                </button>
                
                {activeTab !== "grafik" && (
                  <button onClick={handleExport} disabled={(activeTab === 'siswa' && filteredResults.length === 0) || (activeTab === 'soal' && questionAnalysis.length === 0) || isFetchingResults} className="inline-flex items-center justify-center font-semibold rounded-xl px-5 py-2.5 text-sm bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm disabled:opacity-50">
                    <Download className="w-4 h-4 mr-1.5" />Export {activeTab === "siswa" ? "Nilai" : "Analisis"}
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              <button onClick={() => setActiveTab("siswa")} className={`px-4 py-2 text-sm font-semibold rounded-lg transition whitespace-nowrap ${activeTab === "siswa" ? "bg-emerald-100 text-emerald-800" : "text-slate-500 hover:bg-slate-100"}`}>Daftar Nilai Siswa</button>
              <button onClick={() => setActiveTab("soal")} className={`px-4 py-2 text-sm font-semibold rounded-lg transition whitespace-nowrap ${activeTab === "soal" ? "bg-emerald-100 text-emerald-800" : "text-slate-500 hover:bg-slate-100"}`}>Analisis Butir Soal</button>
              <button onClick={() => setActiveTab("grafik")} className={`px-4 py-2 text-sm font-semibold rounded-lg transition whitespace-nowrap ${activeTab === "grafik" ? "bg-emerald-100 text-emerald-800" : "text-slate-500 hover:bg-slate-100"}`}>Visualisasi Data</button>
            </div>

            {isFetchingResults ? (
               <Card className="p-12 text-center"><p className="text-sm text-slate-500 animate-pulse">Mengambil data...</p></Card>
            ) : activeTab === "siswa" ? (
              filteredResults.length === 0 ? (
                <Card className="p-12 text-center"><Trophy className="w-10 h-10 text-slate-300 mx-auto mb-3" /><p className="font-semibold text-slate-700 mb-1">Belum ada hasil</p><p className="text-sm text-slate-500">Tidak ada siswa yang cocok dengan filter ini.</p></Card>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                    <Card className="p-4"><p className="text-xs text-slate-500 mb-1">Total Peserta</p><p className="text-2xl font-bold text-slate-900">{filteredResults.length}</p></Card>
                    <Card className="p-4"><p className="text-xs text-slate-500 mb-1">Rata-rata Nilai</p><p className="text-2xl font-bold text-emerald-600">{rataRata}</p></Card>
                    <Card className="p-4"><p className="text-xs text-slate-500 mb-1">Total Pelanggaran</p><p className="text-2xl font-bold text-amber-600">{filteredResults.reduce((sum, r) => sum + r.violations, 0)}x</p></Card>
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
                          {filteredResults.map((r) => (
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
                                  <button onClick={() => setSelectedResult(r)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Lihat & Beri Nilai Esai"><Eye className="w-4 h-4" /></button>
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
            ) : activeTab === "soal" ? (
              <div className="space-y-3">
                {questionAnalysis.map((qa, i) => (
                  <Card key={i} className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 font-bold flex items-center justify-center shrink-0">{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 mb-1 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: qa.question.question }} />
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-slate-500">Tipe: {qa.question.type.replace("_", " ").toUpperCase()}</p>
                        <span className="text-slate-300">•</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${qa.badgeClass}`}>{qa.kategori}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 bg-slate-50 px-4 py-2 rounded-xl">
                      <div className="text-center">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Benar</p>
                        <p className="font-bold text-slate-900">{qa.correctCount} <span className="text-xs text-slate-400 font-normal">/ {filteredResults.length}</span></p>
                      </div>
                      <div className="w-px h-8 bg-slate-200"></div>
                      <div className="text-center">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Persentase</p>
                        <p className={`font-bold ${qa.percentage >= 70 ? 'text-emerald-600' : qa.percentage >= 30 ? 'text-amber-600' : 'text-red-600'}`}>{qa.percentage}%</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              // TAB 3: GRAFIK VISUALISASI
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-emerald-600" />
                    Distribusi Nilai Siswa
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={scoreRanges} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <Tooltip 
                          cursor={{ fill: '#f1f5f9' }}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="count" name="Jumlah Siswa" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-amber-600" />
                    Proporsi Tingkat Kesukaran
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={difficultyData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {difficultyData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL ANALISIS JAWABAN SISWA & PENILAIAN ESAI */}
      {selectedResult && selectedExam && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 sm:p-6">
          <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col animate-fade-in-up">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <div>
                <h3 className="font-bold text-slate-900">Lembar Jawaban: {selectedResult.studentName}</h3>
                <p className="text-xs text-slate-500">Nilai Saat Ini: {selectedResult.score} • Kelas: {selectedResult.className}</p>
              </div>
              <button onClick={() => setSelectedResult(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-4 overflow-y-auto space-y-4 bg-slate-50/50">
              {selectedExam.questions.map((q, i) => {
                const studentAns = selectedResult.answers ? selectedResult.answers[q.id] : undefined;
                const isCorrect = q.type !== "essay" && isJawabanBenar(q, studentAns);
                const isEssay = q.type === "essay";
                
                return (
                  <div key={q.id} className="p-4 bg-white border border-slate-200 rounded-xl">
                    <div className="flex gap-3 mb-3">
                      <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${isEssay ? 'bg-blue-100 text-blue-700' : isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{i + 1}</div>
                      <div className="flex-1 font-medium text-slate-900 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: q.question }} />
                    </div>
                    
                    <div className="ml-9 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className={`p-3 rounded-lg border ${isEssay ? 'bg-blue-50 border-blue-100 col-span-full' : isCorrect ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
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
                      
                      {!isEssay && (
                        <div className="p-3 rounded-lg border bg-slate-50 border-slate-200">
                          <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Kunci Jawaban</p>
                          <div className="text-slate-800 prose prose-sm max-w-none">
                            {q.type === "complex_mc" ? q.correctAnswers?.map((a, idx) => <div key={idx} dangerouslySetInnerHTML={{ __html: a }} />)
                            : q.type === "true_false" ? (q.trueFalseAnswer ? "Benar" : "Salah")
                            : q.type === "short_answer" ? q.acceptedAnswers?.map((a, idx) => <div key={idx} dangerouslySetInnerHTML={{ __html: a }} />)
                            : q.type === "multi_true_false" ? "Lihat Pernyataan"
                            : q.type === "matching" ? "Lihat Pasangan"
                            : q.type === "ordering" ? q.items?.map((item, idx) => <div key={idx} dangerouslySetInnerHTML={{ __html: item }} />)
                            : <div dangerouslySetInnerHTML={{ __html: q.correctAnswer || "-" }} />}
                          </div>
                        </div>
                      )}
                    </div>

                    {isEssay && (
                      <div className="ml-9 mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-blue-900">Beri Nilai Esai (0-100)</p>
                          <p className="text-xs text-blue-700">Nilai akan ditambahkan ke total skor otomatis.</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="number" min={0} max={100} value={essayScores[q.id] ?? ""} onChange={(e) => {
                              const val = parseInt(e.target.value);
                              setEssayScores(prev => ({ ...prev, [q.id]: isNaN(val) ? 0 : val }));
                            }} className="w-24 px-3 py-2 text-lg font-bold text-center border-2 border-blue-300 rounded-xl focus:outline-none focus:border-blue-500" placeholder="0" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="p-4 border-t bg-slate-50 rounded-b-2xl flex justify-end gap-2">
               <Button variant="secondary" onClick={() => setSelectedResult(null)}>Tutup</Button>
               <Button onClick={handleSaveEssayGrades} disabled={isSavingGrades} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                 <Save className="w-4 h-4 mr-1.5" />
                 {isSavingGrades ? "Menyimpan..." : "Simpan Nilai Esai"}
               </Button>
            </div>
          </Card>
        </div>
      )}
    </main>
  );
}