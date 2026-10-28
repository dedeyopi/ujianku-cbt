"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, ChevronLeft, ChevronRight, CheckCircle2, Maximize, Lock, Loader2 } from "lucide-react";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { supabase } from "../../lib/supabase";
import { getSession, saveSession, clearSession } from "../../lib/session";
import { fetchExamForStudent, syncActiveSession, removeActiveSession } from "../../lib/db";
import type { Exam, Question } from "../../lib/types";

function shuffleArrayWithSeed<T>(array: T[], seedString: string): T[] {
  let seed = 0;
  for (let i = 0; i < seedString.length; i++) seed += seedString.charCodeAt(i);
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    seed = (seed * 9301 + 49297) % 233280;
    const rnd = seed / 233280;
    const j = Math.floor(rnd * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getRandomizedExam(exam: Exam, studentId: string): Exam {
  const shuffledQuestions = shuffleArrayWithSeed(exam.questions, studentId + exam.id).map(q => {
    const newQ = { ...q };
    if ((newQ.type === "multiple_choice" || newQ.type === "complex_mc") && newQ.options) {
      const qSeed = studentId + q.id;
      if (newQ.optionImages) {
        const zipped = newQ.options.map((opt, i) => ({ opt, img: newQ.optionImages![i] }));
        const shuffled = shuffleArrayWithSeed(zipped, qSeed);
        newQ.options = shuffled.map(z => z.opt);
        newQ.optionImages = shuffled.map(z => z.img);
      } else {
        newQ.options = shuffleArrayWithSeed(newQ.options, qSeed);
      }
    }
    if (newQ.type === "matching" && newQ.pairs) {
      newQ.pairs = shuffleArrayWithSeed(newQ.pairs, studentId + q.id);
    }
    return newQ;
  });
  return { ...exam, questions: shuffledQuestions };
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [studentData, setStudentData] = useState<{ id: string; className: string } | null>(null);

  const violationsRef = useRef(0);
  const skipAutoSaveRef = useRef(true);

  useEffect(() => {
    async function loadExam() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/siswa/login"); return; }

      const { data: profile } = await supabase.from("users").select("full_name, class_name").eq("id", user.id).single();
      if (!profile) { router.push("/siswa/login"); return; }

      const { data: existingResult } = await supabase
        .from("results")
        .select("id")
        .eq("exam_id", examId)
        .eq("student_id", user.id)
        .maybeSingle();

      if (existingResult) {
        alert("Anda sudah mengerjakan ujian ini.");
        router.push("/siswa");
        return;
      }

      const found = await fetchExamForStudent(examId);
      if (!found || !found.isActive) { router.push("/siswa"); return; }
      
      const randomizedExam = getRandomizedExam(found, user.id);
      setExam(randomizedExam);
      setNama(profile.full_name);
      setStudentData({ id: user.id, className: profile.class_name || "-" });

      const existing = getSession(examId);
      if (existing && existing.studentName === profile.full_name) {
        setJawaban(existing.answers);
        setViolations(existing.violations);
        violationsRef.current = existing.violations;
        const elapsed = Math.floor((Date.now() - new Date(existing.startedAt).getTime()) / 1000);
        const sisa = Math.max(0, found.duration - elapsed);
        setSisaWaktu(sisa);
        setIsResume(true);
        
        if (sisa <= 0) {
           setSelesai(true);
        }
      } else {
        const initialAnswers: Record<string, any> = {};
        randomizedExam.questions.forEach(q => {
          if (q.type === "ordering" && q.items) {
            initialAnswers[q.id] = shuffleArrayWithSeed(q.items, user.id + q.id);
          }
        });

        saveSession({
          examId, studentId: user.id, studentName: profile.full_name,
          answers: initialAnswers, startedAt: new Date().toISOString(), violations: 0, lastUpdated: new Date().toISOString()
        });
        setJawaban(initialAnswers);
        setSisaWaktu(found.duration);
      }
      setLoading(false);
    }
    loadExam();
  }, [examId, router]);

  useEffect(() => {
    if (!exam || !studentData || showStartPrompt || selesai) return;

    const sync = async () => {
      await syncActiveSession({
        id: `${exam.id}_${studentData.id}`,
        examId: exam.id,
        studentId: studentData.id,
        studentName: nama,
        className: studentData.className,
        currentQuestion: nomorSoal + 1,
        totalQuestions: exam.questions.length,
        violations: violations,
        lastSeen: new Date().toISOString(),
      });
    };

    sync();
    const interval = setInterval(sync, 5000);
    return () => clearInterval(interval);
  }, [exam, studentData, nama, nomorSoal, violations, showStartPrompt, selesai]);

  useEffect(() => {
    if (showStartPrompt || selesai) return;

    const disableContextMenu = (e: MouseEvent) => e.preventDefault();
    const disableCopyPaste = (e: ClipboardEvent) => e.preventDefault();
    const disableSelect = (e: Event) => e.preventDefault();

    document.addEventListener("contextmenu", disableContextMenu);
    document.addEventListener("copy", disableCopyPaste);
    document.addEventListener("cut", disableCopyPaste);
    document.addEventListener("paste", disableCopyPaste);
    document.addEventListener("selectstart", disableSelect);

    return () => {
      document.removeEventListener("contextmenu", disableContextMenu);
      document.removeEventListener("copy", disableCopyPaste);
      document.removeEventListener("cut", disableCopyPaste);
      document.removeEventListener("paste", disableCopyPaste);
      document.removeEventListener("selectstart", disableSelect);
    };
  }, [showStartPrompt, selesai]);

  useEffect(() => {
    if (!exam || skipAutoSaveRef.current) { skipAutoSaveRef.current = false; return; }
    const s = getSession(examId);
    if (!s) return;
    saveSession({ ...s, answers: jawaban, violations: violationsRef.current, lastUpdated: new Date().toISOString() });
    setSavedFlash(true); setTimeout(() => setSavedFlash(false), 1200);
  }, [jawaban, exam, examId]);

  // TIMER: Cek waktu global (endTime) & waktu lokal (sisaWaktu)
  useEffect(() => {
    if (!exam || showStartPrompt || selesai) return;
    
    if (exam.endTime) {
      const now = new Date().getTime();
      if (now > new Date(exam.endTime).getTime()) {
        submitExam(true);
        return;
      }
    }

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
    if (!exam || !studentData) return;
    if (!auto) {
      const belum = exam.questions.filter(q => jawaban[q.id] === undefined || (Array.isArray(jawaban[q.id]) && jawaban[q.id].length === 0) || jawaban[q.id] === "").length;
      if (belum > 0 && !confirm(`Masih ada ${belum} soal belum dijawab. Yakin kirim?`)) return;
    }
    
    setSelesai(true);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: exam.id,
          studentId: studentData.id,
          answers: jawaban,
          violations: violationsRef.current
        })
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Gagal mengirim jawaban.");

      localStorage.setItem("hasilUjian", JSON.stringify({
        nama, examTitle: exam.title, benar: result.correct, total: result.total, nilai: result.score, violations: violationsRef.current
      }));

      await removeActiveSession(`${exam.id}_${studentData.id}`);
      clearSession(examId);
      
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      router.push("/hasil");
      
    } catch (err: any) {
      alert("Terjadi kesalahan sistem saat mengirim jawaban: " + err.message);
      setIsSubmitting(false);
      if (auto) alert("Koneksi terputus. Harap sambungkan kembali internet Anda dan refresh halaman ini.");
    }
  }

  if (loading || !exam) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p className="text-sm text-slate-500 animate-pulse">Menyiapkan soal...</p></div>;
  }

  if (isSubmitting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Mengirim Jawaban...</h2>
        <p className="text-slate-400 text-center max-w-md">Sistem sedang menilai jawaban Anda. Jangan tutup atau refresh halaman ini.</p>
      </div>
    );
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
            <ul className="list-disc pl-4 space-y-1">
              <li>Layar penuh wajib.</li>
              <li>Jangan pindah tab.</li>
              <li>Klik kanan & Copy-Paste dinonaktifkan.</li>
              <li>Jawaban auto-save.</li>
              <li>Ujian akan otomatis terkumpul jika waktu habis.</li>
            </ul>
          </div>
          <Button onClick={startExam} className="w-full">Mulai Ujian</Button>
        </Card>
      </main>
    );
  }

  const soal = exam.questions[nomorSoal];
  const ans = jawaban[soal.id];

  return (
    <div className="min-h-screen bg-slate-100 p-6" style={{ userSelect: "none", WebkitUserSelect: "none", msUserSelect: "none" }}>
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
          <div className="text-lg font-semibold mb-4 prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: soal.question }} />
          
          {soal.image && <img src={soal.image} className="max-h-64 mb-4 rounded-xl border" />}

          <div className="space-y-4">
            {soal.type === "multiple_choice" && soal.options?.map((opt, i) => {
              const identifier = opt || `Opsi ${i+1}`;
              const img = soal.optionImages?.[i];
              return (
                <button key={i} onClick={() => updateJawaban(soal.id, identifier)} className={`w-full text-left p-3 rounded-xl border-2 flex items-center gap-3 transition ${ans === identifier ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-blue-300"}`}>
                  <span className="w-7 h-7 rounded-full bg-white border flex items-center justify-center font-bold shrink-0">{String.fromCharCode(65+i)}</span>
                  {img && <img src={img} className="h-16 object-contain rounded border bg-white" alt={`Opsi ${i+1}`} />}
                  <div className="font-medium prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: opt }} />
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
                  <div className="font-medium prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: opt }} />
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
                  <div className="text-sm flex-1 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: st.text }} />
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
                      <div className="flex-1 w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: p.left }} />
                      <select onChange={(e) => updateJawaban(soal.id, {...curr, [p.left]: e.target.value})} value={curr[p.left] || ""} className="flex-1 w-full p-3 rounded-xl border-2 border-slate-200 bg-white text-sm focus:border-blue-500">
                        <option value="" disabled>-- Pilih Pasangan --</option>
                        {soal.pairs?.map(pr => <option key={pr.right} value={pr.right}>{pr.right.replace(/<[^>]*>?/gm, '')}</option>)}
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
                    <div className="flex-1 text-sm prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: item }} />
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