"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, ChevronLeft, ChevronRight, CheckCircle2, Maximize, Lock, Loader2, Clock, ArrowRight } from "lucide-react";
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

      const { data: existingResult } = await supabase.from("results").select("id").eq("exam_id", examId).eq("student_id", user.id).maybeSingle();
      if (existingResult) { alert("Anda sudah mengerjakan ujian ini."); router.push("/siswa"); return; }

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
        if (sisa <= 0) setSelesai(true);
      } else {
        const initialAnswers: Record<string, any> = {};
        randomizedExam.questions.forEach(q => {
          if (q.type === "ordering" && q.items) initialAnswers[q.id] = shuffleArrayWithSeed(q.items, user.id + q.id);
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
        id: `${exam.id}_${studentData.id}`, examId: exam.id, studentId: studentData.id,
        studentName: nama, className: studentData.className, currentQuestion: nomorSoal + 1,
        totalQuestions: exam.questions.length, violations: violations, lastSeen: new Date().toISOString(),
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

  useEffect(() => {
    if (!exam || showStartPrompt || selesai) return;
    if (exam.endTime) {
      const now = new Date().getTime();
      if (now > new Date(exam.endTime).getTime()) { submitExam(true); return; }
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
        body: JSON.stringify({ examId: exam.id, studentId: studentData.id, answers: jawaban, violations: violationsRef.current })
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
    return <div className="min-h-screen flex items-center justify-center bg-[#0B1120]"><Loader2 className="w-8 h-8 animate-spin text-amber-400" /></div>;
  }

  if (isSubmitting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B1120] text-white p-6">
        <Loader2 className="w-14 h-14 animate-spin text-amber-400 mb-6" />
        <h2 className="text-2xl font-bold mb-2">Mengirim Jawaban...</h2>
        <p className="text-slate-400 text-center max-w-md">Sistem sedang menilai jawaban Anda. Jangan tutup atau refresh halaman ini.</p>
      </div>
    );
  }

  if (showStartPrompt) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-[#0B1120] relative overflow-hidden">
        <div className="absolute top-0 left-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[100px] -translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
        
        <div className="p-8 max-w-lg w-full text-center bg-slate-800 border border-slate-700 shadow-2xl relative z-10 rounded-3xl">
          <div className="w-20 h-20 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Lock className="w-10 h-10 text-amber-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{exam.title}</h1>
          <p className="text-lg font-medium text-slate-300 mb-8">{exam.questions.length} soal • {Math.floor(exam.duration / 60)} menit</p>
          
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl text-left mb-8">
            <p className="font-bold text-amber-400 text-lg mb-3 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Perhatian Sebelum Memulai:</p>
            <ul className="list-disc pl-5 space-y-2 text-base text-slate-300">
              <li>Ujian akan berjalan dalam mode <b className="text-white">Layar Penuh</b>.</li>
              <li>Dilarang berpindah tab atau keluar dari layar ujian.</li>
              <li>Klik kanan, blok teks, dan Copy-Paste dinonaktifkan.</li>
              <li>Jawaban tersimpan secara otomatis (Auto-save).</li>
              <li>Ujian akan terkumpul paksa jika waktu habis.</li>
            </ul>
          </div>

          <button onClick={startExam} className="w-full inline-flex items-center justify-center font-bold rounded-xl px-6 py-4 text-lg text-slate-900 bg-amber-400 hover:bg-amber-300 transition-all shadow-[0_0_20px_rgba(251,191,36,0.2)] hover:shadow-[0_0_30px_rgba(251,191,36,0.4)]">
            Saya Mengerti, Mulai Ujian <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </main>
    );
  }

  const soal = exam.questions[nomorSoal];
  const ans = jawaban[soal.id];

  return (
    <div className="h-screen w-full bg-[#0B1120] p-4 sm:p-6 font-sans flex flex-col overflow-hidden" style={{ userSelect: "none", WebkitUserSelect: "none", msUserSelect: "none" }}>
      
      {showWarning && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="p-8 max-w-md w-full bg-slate-800 border-2 border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.3)] animate-fade-in-up rounded-3xl">
            <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4 border border-red-500/30">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white text-center mb-2">Pelanggaran Terdeteksi!</h3>
            <p className="text-sm text-slate-300 text-center mb-6">Anda terdeteksi keluar dari layar ujian. Tindakan ini tercatat oleh sistem.</p>
            <div className="bg-slate-900 rounded-xl p-4 text-center mb-6 border border-slate-700">
              <p className="text-xs text-slate-400 mb-1">Total Pelanggaran</p>
              <p className="text-4xl font-black text-red-500">{violations}<span className="text-lg text-red-400 font-normal">x</span></p>
            </div>
            <button onClick={() => setShowWarning(false)} className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition">Kembali ke Ujian</button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
        
        {/* SIDEBAR KIRI */}
        <aside className="hidden lg:flex flex-col w-80 shrink-0 h-full gap-4">
          <div className="bg-slate-800 border border-slate-700 shadow-lg rounded-2xl p-5 shrink-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0">
                <span className="font-black text-amber-400 text-base">{nama.charAt(0)}</span>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Peserta</p>
                <p className="font-bold text-white text-sm truncate">{nama}</p>
              </div>
            </div>
            <div className="bg-slate-900 px-4 py-3 rounded-xl border border-slate-700 text-center">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-center gap-1"><Clock className="w-3.5 h-3.5"/> Sisa Waktu</p>
              <p className={`font-black text-3xl tabular-nums tracking-tight ${sisaWaktu < 60 ? "text-red-500 animate-pulse" : "text-amber-400"}`}>
                {Math.floor(sisaWaktu/60)}:{(sisaWaktu%60).toString().padStart(2,'0')}
              </p>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 shadow-lg rounded-2xl p-5 flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <p className="text-sm font-semibold text-slate-300">Navigasi Soal</p>
              <p className="text-xs text-slate-500">{exam.questions.length} Butir</p>
            </div>
            
            <div className="grid grid-cols-5 gap-2 overflow-y-auto pr-1 flex-1 content-start">
              {exam.questions.map((q, i) => {
                const answered = jawaban[q.id] !== undefined && (Array.isArray(jawaban[q.id]) ? jawaban[q.id].length > 0 : jawaban[q.id] !== "");
                return (
                  <button key={q.id} onClick={() => setNomorSoal(i)} className={`h-10 rounded-lg font-bold text-sm transition-all flex items-center justify-center ${i === nomorSoal ? "bg-amber-400 text-slate-900 shadow-[0_0_10px_rgba(251,191,36,0.4)] scale-110" : answered ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-900 text-slate-500 border border-slate-700 hover:bg-slate-700"}`}>{i+1}</button>
                );
              })}
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-700/50 shrink-0">
               <button onClick={() => submitExam(false)} className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-xl font-bold text-sm transition-all shadow-[0_0_15px_rgba(52,211,153,0.2)] flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4"/> Selesai & Kirim
               </button>
            </div>
          </div>
        </aside>

        {/* AREA SOAL */}
        <main className="flex-1 flex flex-col h-full overflow-hidden">
          
          <div className="lg:hidden p-4 mb-4 flex justify-between items-center bg-slate-800 border border-slate-700 shadow-lg rounded-2xl shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center">
                <span className="font-black text-amber-400 text-base">{nama.charAt(0)}</span>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Peserta</p>
                <p className="font-bold text-white text-sm truncate max-w-[120px]">{nama}</p>
              </div>
            </div>
            <div className="text-right bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700">
              <p className={`font-black text-xl tabular-nums tracking-tight ${sisaWaktu < 60 ? "text-red-500 animate-pulse" : "text-amber-400"}`}>
                {Math.floor(sisaWaktu/60)}:{(sisaWaktu%60).toString().padStart(2,'0')}
              </p>
            </div>
          </div>

          <div className="flex-1 bg-slate-800 border border-slate-700 shadow-xl rounded-3xl p-6 sm:p-10 flex flex-col overflow-y-auto mb-4">
            <div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4 shrink-0">
              <p className="text-sm sm:text-base font-bold text-slate-300 uppercase tracking-wider">Soal {nomorSoal + 1} <span className="text-slate-500 font-normal">dari {exam.questions.length}</span></p>
              {savedFlash && <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 animate-fade-in-up"><CheckCircle2 className="w-4 h-4"/> Tersimpan</span>}
            </div>
            
            {/* PERTANYAAN SOAL: Memaksa warna putih terang */}
            <div 
              className="rich-text-content soal-pertanyaan font-medium text-white mb-10 shrink-0 prose prose-invert max-w-none [&_*]:!text-white [&_*]:!bg-transparent" 
              dangerouslySetInnerHTML={{ __html: soal.question }} 
            />
            
            {soal.image && <img src={soal.image} className="max-h-64 mb-10 rounded-xl border border-slate-600 shadow-md shrink-0 object-contain self-start" />}

            <div className="space-y-4 shrink-0">
              {soal.type === "multiple_choice" && soal.options?.map((opt, i) => {
                const identifier = opt || `Opsi ${i+1}`;
                const img = soal.optionImages?.[i];
                const isSelected = ans === identifier;
                return (
                  <button key={i} onClick={() => updateJawaban(soal.id, identifier)} className={`w-full text-left p-5 rounded-2xl border-2 flex items-center gap-4 transition-all duration-200 ${isSelected ? "border-amber-400 bg-amber-400/10 shadow-[0_0_15px_rgba(251,191,36,0.1)]" : "border-slate-600 bg-slate-900/50 hover:border-slate-500"}`}>
                    <span className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0 transition-colors ${isSelected ? "bg-amber-400 text-slate-900" : "bg-slate-700 text-slate-300"}`}>{String.fromCharCode(65+i)}</span>
                    {img && <img src={img} className="h-20 object-contain rounded-lg border border-slate-600 bg-white p-1" alt={`Opsi ${i+1}`} />}
                    <div 
                      className={`rich-text-content text-lg sm:text-xl prose prose-sm max-w-none prose-invert [&_*]:!text-inherit ${isSelected ? 'text-amber-100 font-medium' : 'text-slate-200'}`} 
                      dangerouslySetInnerHTML={{ __html: opt }} 
                    />
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
                  }} className={`w-full text-left p-5 rounded-2xl border-2 flex items-center gap-4 transition-all duration-200 ${selected ? "border-amber-400 bg-amber-400/10 shadow-[0_0_15px_rgba(251,191,36,0.1)]" : "border-slate-600 bg-slate-900/50 hover:border-slate-500"}`}>
                    <div className={`w-8 h-8 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${selected ? "bg-amber-400 border-amber-400 text-slate-900" : "border-slate-500"}`}>{selected && <CheckCircle2 className="w-5 h-5"/>}</div>
                    {img && <img src={img} className="h-20 object-contain rounded-lg border border-slate-600 bg-white p-1" alt={`Opsi ${i+1}`} />}
                    <div 
                      className={`rich-text-content text-lg sm:text-xl prose prose-sm max-w-none prose-invert [&_*]:!text-inherit ${selected ? 'text-amber-100 font-medium' : 'text-slate-200'}`} 
                      dangerouslySetInnerHTML={{ __html: opt }} 
                    />
                  </button>
                );
              })}

              {soal.type === "true_false" && (
                <div className="grid grid-cols-2 gap-4">
                  {[true, false].map(val => {
                    const isSelected = ans === val;
                    return (
                      <button key={String(val)} onClick={() => updateJawaban(soal.id, val)} className={`py-6 rounded-2xl border-2 font-bold text-lg transition-all duration-200 ${isSelected ? "border-amber-400 bg-amber-400/10 text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.1)]" : "border-slate-600 bg-slate-900/50 text-slate-300 hover:border-slate-500"}`}>{val ? "BENAR" : "SALAH"}</button>
                    );
                  })}
                </div>
              )}

              {soal.type === "multi_true_false" && soal.statements?.map((st, i) => {
                const curr = ans || {};
                return (
                  <div key={i} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 border-2 border-slate-600 bg-slate-900/50 rounded-2xl gap-4">
                    {/* PERNYATAAN B/S BERTINGKAT: Memaksa warna putih terang */}
                    <div 
                      className="rich-text-content text-base sm:text-lg text-slate-200 flex-1 prose prose-invert max-w-none [&_*]:!text-white [&_*]:!bg-transparent" 
                      dangerouslySetInnerHTML={{ __html: st.text }} 
                    />
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => updateJawaban(soal.id, {...curr, [i]: true})} className={`px-6 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${curr[i] === true ? "bg-amber-400 border-amber-400 text-slate-900" : "border-slate-600 text-slate-400 hover:border-slate-500"}`}>BENAR</button>
                      <button onClick={() => updateJawaban(soal.id, {...curr, [i]: false})} className={`px-6 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${curr[i] === false ? "bg-amber-400 border-amber-400 text-slate-900" : "border-slate-600 text-slate-400 hover:border-slate-500"}`}>SALAH</button>
                    </div>
                  </div>
                );
              })}

              {soal.type === "matching" && (
                <div className="space-y-3">
                  {soal.pairs?.map((p, i) => {
                    const curr = ans || {};
                    return (
                      <div key={i} className="flex flex-col sm:flex-row gap-4 items-center">
                        <div 
                          className="rich-text-content flex-1 w-full p-4 bg-slate-900/50 border-2 border-slate-600 rounded-xl text-base text-slate-200 prose prose-invert max-w-none [&_*]:!text-white [&_*]:!bg-transparent" 
                          dangerouslySetInnerHTML={{ __html: p.left }} 
                        />
                        <select onChange={(e) => updateJawaban(soal.id, {...curr, [p.left]: e.target.value})} value={curr[p.left] || ""} className="flex-1 w-full p-4 rounded-xl border-2 border-slate-600 bg-slate-800 text-base text-white focus:border-amber-400 focus:outline-none">
                          <option value="" disabled>-- Pilih Pasangan --</option>
                          {soal.pairs?.map(pr => <option key={pr.right} value={pr.right}>{pr.right.replace(/<[^>]*>?/gm, '')}</option>)}
                        </select>
                      </div>
                    );
                  })}
                </div>
              )}

              {soal.type === "ordering" && (
                <div className="space-y-3">
                  {(ans && Array.isArray(ans) ? ans : soal.items || []).map((item, i, arr) => (
                    <div key={i} className="flex gap-4 items-center p-4 bg-slate-900/50 border-2 border-slate-600 rounded-xl">
                      <span className="w-8 text-center font-bold text-amber-400 text-lg">{i+1}</span>
                      <div 
                        className="rich-text-content flex-1 text-base text-slate-200 prose prose-invert max-w-none [&_*]:!text-white [&_*]:!bg-transparent" 
                        dangerouslySetInnerHTML={{ __html: item }} 
                      />
                      <div className="flex flex-col gap-1">
                        <button disabled={i===0} onClick={() => { const newArr = [...arr]; [newArr[i-1], newArr[i]] = [newArr[i], newArr[i-1]]; updateJawaban(soal.id, newArr); }} className="p-2 bg-slate-700 rounded-lg text-slate-300 hover:bg-slate-600 disabled:opacity-30">▲</button>
                        <button disabled={i===arr.length-1} onClick={() => { const newArr = [...arr]; [newArr[i+1], newArr[i]] = [newArr[i], newArr[i+1]]; updateJawaban(soal.id, newArr); }} className="p-2 bg-slate-700 rounded-lg text-slate-300 hover:bg-slate-600 disabled:opacity-30">▼</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {soal.type === "short_answer" && (
                <input type="text" value={ans || ""} onChange={(e) => updateJawaban(soal.id, e.target.value)} placeholder="Ketik jawaban Anda..." className="w-full p-5 border-2 border-slate-600 bg-slate-900/50 rounded-2xl text-xl text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none transition" />
              )}

              {soal.type === "essay" && (
                <div>
                  <textarea rows={10} value={ans || ""} onChange={(e) => updateJawaban(soal.id, e.target.value)} placeholder="Ketik jawaban panjang Anda di sini..." className="w-full p-5 border-2 border-slate-600 bg-slate-900/50 rounded-2xl text-lg text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none resize-none transition" />
                  <p className="text-sm font-medium text-amber-500 mt-2">Jawaban esai akan dinilai manual oleh guru.</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between gap-4 shrink-0">
            <button 
              onClick={() => setNomorSoal(n => Math.max(0, n-1))} 
              disabled={nomorSoal===0} 
              className="flex-1 py-4 px-6 rounded-xl font-bold text-base text-slate-300 bg-slate-800 border-2 border-slate-700 hover:bg-slate-700 disabled:opacity-30 transition flex items-center justify-center gap-2"
            >
              <ChevronLeft className="w-5 h-5"/> Sebelumnya
            </button>
            
            {nomorSoal === exam.questions.length - 1 ? (
              <button 
                onClick={() => submitExam(false)} 
                className="flex-1 py-4 px-6 rounded-xl font-bold text-base text-slate-900 bg-emerald-400 hover:bg-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.2)] transition flex items-center justify-center gap-2 lg:hidden"
              >
                <CheckCircle2 className="w-5 h-5"/> Selesai & Kirim
              </button>
            ) : (
              <button 
                onClick={() => setNomorSoal(n => Math.min(exam.questions.length-1, n+1))} 
                className="flex-1 py-4 px-6 rounded-xl font-bold text-base text-slate-900 bg-amber-400 hover:bg-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.2)] transition flex items-center justify-center gap-2"
              >
                Selanjutnya <ChevronRight className="w-5 h-5"/>
              </button>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}