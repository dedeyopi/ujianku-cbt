"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, ChevronLeft, ChevronRight, CheckCircle2, Maximize, Lock } from "lucide-react";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { supabase } from "../../lib/supabase"; // IMPORT SUPABASE
import { getSession, saveSession, clearSession } from "../../lib/session";
import { fetchExamById, submitResult } from "../../lib/db";
import type { Exam, ExamSession, Question } from "../../lib/types";

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
    case "essay": return false;
    default: return false;
  }
}

export function UjianClient() {
  const params = useParams<{ id: string }>();
  const examId = params.id;
  const router = useRouter();

  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [nama, setNama] = useState("");
  const [nomorSoal, setNomorSoal] = useState(0);
  const [jawaban, setJawaban] = useState<Record<string, any>>({});
  const [sisaWaktu, setSisaWaktu] = useState(0);
  const [violations, setViolations] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [showStartPrompt, setShowStartPrompt] = useState(true);
  const [isResume, setIsResume] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [selesai, setSelesai] = useState(false);

  const violationsRef = useRef(0);
  const skipAutoSaveRef = useRef(true);

  // Ambil data ujian dan profil siswa dari Supabase
  useEffect(() => {
    async function loadExam() {
      // 1. Cek Login dari Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/siswa/login"); return; }

      // 2. Ambil Nama Siswa dari tabel users
      const { data: profile } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", user.id)
        .single();

      if (!profile) { router.push("/siswa/login"); return; }

      // 3. Ambil Data Ujian
      const found = await fetchExamById(examId);
      if (!found || !found.isActive) { router.push("/siswa"); return; }
      
      setExam(found);
      setNama(profile.full_name);

      // 4. Cek Sesi Pengerjaan di localStorage (untuk auto-save)
      const existing = getSession(examId);
      if (existing && existing.studentName === profile.full_name) {
        setJawaban(existing.answers);
        setViolations(existing.violations);
        violationsRef.current = existing.violations;
        const elapsed = Math.floor((Date.now() - new Date(existing.startedAt).getTime()) / 1000);
        setSisaWaktu(Math.max(0, found.duration - elapsed));
        setIsResume(true);
      } else {
        saveSession({
          examId, studentId: user.id, studentName: profile.full_name,
          answers: {}, startedAt: new Date().toISOString(), violations: 0, lastUpdated: new Date().toISOString()
        });
        setSisaWaktu(found.duration);
      }
      setLoading(false);
    }
    loadExam();
  }, [examId, router]);

  useEffect(() => {
    if (!exam || skipAutoSaveRef.current) { skipAutoSaveRef.current = false; return; }
    const s = getSession(examId);
    if (!s) return;
    saveSession({ ...s, answers: jawaban, violations: violationsRef.current, lastUpdated: new Date().toISOString() });
    setSavedFlash(true); setTimeout(() => setSavedFlash(false), 1200);
  }, [jawaban, exam, examId]);

  useEffect(() => {
    if (!exam || showStartPrompt || selesai) return;
    if (sisaWaktu <= 0) { submitExam(true); return; }
    const t = setTimeout(() => setSisaWaktu(w => w - 1), 1000);
    return () => clearTimeout(t);
  }, [sisaWaktu, exam, showStartPrompt, selesai]);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  useEffect(() => {
    if (!exam || showStartPrompt || selesai) return;
    const handleVisibility = () => {
      if (document.hidden) {
        violationsRef.current += 1; setViolations(violationsRef.current); setShowWarning(true);
        const s = getSession(examId);
        if (s) saveSession({ ...s, violations: violationsRef.current, lastUpdated: new Date().toISOString() });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [exam, showStartPrompt, selesai, examId]);

  const startExam = useCallback(() => {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    setShowStartPrompt(false);
  }, []);

  function updateJawaban(soalId: string, value: any) {
    setJawaban(prev => ({ ...prev, [soalId]: value }));
  }

  async function submitExam(auto = false) {
    if (!exam) return;
    if (!auto) {
      const belum = exam.questions.filter(q => jawaban[q.id] === undefined || (Array.isArray(jawaban[q.id]) && jawaban[q.id].length === 0) || jawaban[q.id] === "").length;
      if (belum > 0 && !confirm(`Masih ada ${belum} soal belum dijawab. Yakin kirim?`)) return;
    }
    setSelesai(true);

    let benar = 0;
    exam.questions.forEach(q => { if (isJawabanBenar(q, jawaban[q.id])) benar++; });
    const nilai = Math.round((benar / exam.questions.length) * 100);

    // Simpan Hasil ke Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Ambil class_name dari profil
      const { data: profile } = await supabase.from("users").select("class_name").eq("id", user.id).single();
      
      await submitResult({
        id: crypto.randomUUID(), examId: exam.id, examTitle: exam.title,
        studentId: user.id, studentName: nama, className: profile?.class_name || "-",
        score: nilai, correct: benar, total: exam.questions.length, violations: violationsRef.current, submittedAt: new Date().toISOString()
      });

      // Simpan untuk tampilan halaman hasil
      localStorage.setItem("hasilUjian", JSON.stringify({
        nama, examTitle: exam.title, benar, total: exam.questions.length, nilai, violations: violationsRef.current
      }));
    }

    clearSession(examId);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    router.push("/hasil");
  }

  if (loading || !exam) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p className="text-sm text-slate-500 animate-pulse">Memuat ujian...</p></div>;
  }

  if (showStartPrompt) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
        <Card className="p-8 max-w-md w-full text-center">
          <Lock className="w-10 h-10 text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-1">{exam.title}</h1>
          <p className="text-sm text-slate-500 mb-6">{exam.questions.length} soal • {Math.floor(exam.duration / 60)} menit</p>
          <div className="bg-amber-50 p-4 rounded-xl text-left text-xs text-amber-800 mb-6">
            <p className="font-bold mb-1">Perhatian:</p>
            <ul className="list-disc pl-4 space-y-1"><li>Layar penuh wajib.</li><li>Jangan pindah tab.</li><li>Jawaban auto-save.</li></ul>
          </div>
          <Button onClick={startExam} className="w-full">Mulai Ujian</Button>
        </Card>
      </main>
    );
  }

  const soal = exam.questions[nomorSoal];
  const ans = jawaban[soal.id];

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-3xl mx-auto">
        {showWarning && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6">
            <Card className="p-6 max-w-md w-full">
              <h3 className="font-bold text-red-600 text-lg mb-2">Pelanggaran!</h3>
              <p className="text-sm mb-4">Anda terdeteksi keluar dari layar ujian. Total: {violations}x</p>
              <Button onClick={() => setShowWarning(false)} className="w-full">Mengerti</Button>
            </Card>
          </div>
        )}

        <Card className="p-4 mb-4 flex justify-between items-center bg-white">
          <div><p className="text-xs text-slate-500">Peserta</p><p className="font-bold">{nama}</p></div>
          <div className="text-right"><p className="text-xs text-slate-500">Waktu</p><p className={`font-bold ${sisaWaktu < 60 ? "text-red-600 animate-pulse" : "text-blue-600"}`}>{Math.floor(sisaWaktu/60)}:{(sisaWaktu%60).toString().padStart(2,'0')}</p></div>
        </Card>

        <Card className="p-6 mb-4 bg-white">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm font-semibold text-slate-500">Soal {nomorSoal + 1} / {exam.questions.length}</p>
            {savedFlash && <span className="text-xs text-emerald-600">Tersimpan</span>}
          </div>
          <h2 className="text-lg font-semibold mb-4">{soal.question}</h2>
          {soal.image && <img src={soal.image} className="max-h-64 mb-4 rounded-xl border" />}

          <div className="space-y-4">
            {soal.type === "multiple_choice" && soal.options?.map((opt, i) => {
              const identifier = opt || `Opsi ${i+1}`;
              const img = soal.optionImages?.[i];
              return (
                <button key={i} onClick={() => updateJawaban(soal.id, identifier)} className={`w-full text-left p-3 rounded-xl border-2 flex items-center gap-3 transition ${ans === identifier ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-blue-300"}`}>
                  <span className="w-7 h-7 rounded-full bg-white border flex items-center justify-center font-bold shrink-0">{String.fromCharCode(65+i)}</span>
                  {img && <img src={img} className="h-16 object-contain rounded border bg-white" alt={`Opsi ${i+1}`} />}
                  {opt && <span className="font-medium">{opt}</span>}
                </button>
              );
            })}

            {soal.type === "complex_mc" && soal.options?.map((opt, i) => {
              const identifier = opt || `Opsi ${i+1}`;
              const img = soal.optionImages?.[i];
              const selected = Array.isArray(ans) && ans.includes(identifier);
              return (
                <button key={i} onClick={() => {
                  const curr = Array.isArray(ans) ? ans : [];
                  updateJawaban(soal.id, selected ? curr.filter(a => a !== identifier) : [...curr, identifier]);
                }} className={`w-full text-left p-3 rounded-xl border-2 flex items-center gap-3 transition ${selected ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-blue-300"}`}>
                  <div className={`w-6 h-6 rounded border-2 flex items-center justify-center shrink-0 ${selected ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300"}`}>{selected && <CheckCircle2 className="w-4 h-4"/>}</div>
                  {img && <img src={img} className="h-16 object-contain rounded border bg-white" alt={`Opsi ${i+1}`} />}
                  {opt && <span className="font-medium">{opt}</span>}
                </button>
              );
            })}

            {soal.type === "true_false" && (
              <div className="grid grid-cols-2 gap-3">
                {[true, false].map(val => (
                  <button key={String(val)} onClick={() => updateJawaban(soal.id, val)} className={`py-4 rounded-xl border-2 font-bold ${ans === val ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200"}`}>{val ? "Benar" : "Salah"}</button>
                ))}
              </div>
            )}

            {soal.type === "multi_true_false" && soal.statements?.map((st, i) => {
              const curr = ans || {};
              return (
                <div key={i} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border rounded-xl gap-3">
                  <p className="text-sm flex-1">{st.text}</p>
                  <div className="flex gap-2">
                    <button onClick={() => updateJawaban(soal.id, {...curr, [i]: true})} className={`px-4 py-2 rounded-lg border-2 text-sm font-semibold ${curr[i] === true ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "border-slate-200"}`}>Benar</button>
                    <button onClick={() => updateJawaban(soal.id, {...curr, [i]: false})} className={`px-4 py-2 rounded-lg border-2 text-sm font-semibold ${curr[i] === false ? "bg-red-50 border-red-500 text-red-700" : "border-slate-200"}`}>Salah</button>
                  </div>
                </div>
              );
            })}

            {soal.type === "matching" && (
              <div className="space-y-3">
                {soal.pairs?.map((p, i) => {
                  const curr = ans || {};
                  return (
                    <div key={i} className="flex flex-col sm:flex-row gap-2 items-center">
                      <div className="flex-1 w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm">{p.left}</div>
                      <select onChange={(e) => updateJawaban(soal.id, {...curr, [p.left]: e.target.value})} value={curr[p.left] || ""} className="flex-1 w-full p-3 rounded-xl border-2 border-slate-200 bg-white text-sm focus:border-blue-500">
                        <option value="" disabled>-- Pilih Pasangan --</option>
                        {soal.pairs?.map(pr => <option key={pr.right} value={pr.right}>{pr.right}</option>)}
                      </select>
                    </div>
                  );
                })}
              </div>
            )}

            {soal.type === "ordering" && (
              <div className="space-y-2">
                {(ans && Array.isArray(ans) ? ans : soal.items || []).map((item, i, arr) => (
                  <div key={i} className="flex gap-2 items-center p-2 bg-white border rounded-xl">
                    <span className="w-6 text-center font-bold text-slate-400">{i+1}</span>
                    <span className="flex-1 text-sm">{item}</span>
                    <div className="flex flex-col gap-1">
                      <button disabled={i===0} onClick={() => { const newArr = [...arr]; [newArr[i-1], newArr[i]] = [newArr[i], newArr[i-1]]; updateJawaban(soal.id, newArr); }} className="p-1 bg-slate-100 rounded hover:bg-slate-200 disabled:opacity-30">▲</button>
                      <button disabled={i===arr.length-1} onClick={() => { const newArr = [...arr]; [newArr[i+1], newArr[i]] = [newArr[i], newArr[i+1]]; updateJawaban(soal.id, newArr); }} className="p-1 bg-slate-100 rounded hover:bg-slate-200 disabled:opacity-30">▼</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {soal.type === "short_answer" && (
              <input type="text" value={ans || ""} onChange={(e) => updateJawaban(soal.id, e.target.value)} placeholder="Ketik jawaban..." className="w-full p-4 border-2 rounded-xl text-lg focus:border-blue-500 focus:outline-none" />
            )}

            {soal.type === "essay" && (
              <div>
                <textarea rows={6} value={ans || ""} onChange={(e) => updateJawaban(soal.id, e.target.value)} placeholder="Ketik jawaban panjang Anda di sini..." className="w-full p-4 border-2 rounded-xl text-base focus:border-blue-500 focus:outline-none resize-none" />
                <p className="text-xs text-amber-600 mt-1">Jawaban esai akan dinilai manual oleh guru.</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-4 mb-4">
          <div className="flex flex-wrap gap-2">
            {exam.questions.map((q, i) => {
              const answered = jawaban[q.id] !== undefined && (Array.isArray(jawaban[q.id]) ? jawaban[q.id].length > 0 : jawaban[q.id] !== "");
              return (
                <button key={q.id} onClick={() => setNomorSoal(i)} className={`w-10 h-10 rounded-lg font-bold text-sm ${i === nomorSoal ? "bg-blue-600 text-white" : answered ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{i+1}</button>
              );
            })}
          </div>
        </Card>

        <div className="flex justify-between gap-3">
          <Button variant="secondary" onClick={() => setNomorSoal(n => Math.max(0, n-1))} disabled={nomorSoal===0}><ChevronLeft className="w-4 h-4 mr-1"/>Sebelumnya</Button>
          {nomorSoal === exam.questions.length - 1 ? (
            <Button variant="success" onClick={() => submitExam(false)}><CheckCircle2 className="w-4 h-4 mr-1.5"/>Selesai & Kirim</Button>
          ) : (
            <Button onClick={() => setNomorSoal(n => Math.min(exam.questions.length-1, n+1))}>Selanjutnya<ChevronRight className="w-4 h-4 ml-1"/></Button>
          )}
        </div>
      </div>
    </div>
  );
}