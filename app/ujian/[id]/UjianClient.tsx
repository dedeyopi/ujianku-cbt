"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  AlertTriangle, ChevronLeft, ChevronRight, CheckCircle2, 
  Lock, Loader2, Clock, ArrowRight, LayoutGrid, X, RefreshCw,
  Sun, Moon
} from "lucide-react";
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
      const zipped = newQ.options.map((opt, i) => ({ opt, img: newQ.optionImages?.[i], originalIdx: i }));
      const shuffled = shuffleArrayWithSeed(zipped, qSeed);
      newQ.options = shuffled.map(z => z.opt);
      newQ.optionImages = shuffled.map(z => z.img);
      newQ._optIdx = shuffled.map(z => z.originalIdx);
    }
    if (newQ.type === "ordering" && newQ.items) {
      const qSeed = studentId + q.id;
      const zipped = newQ.items.map((item, i) => ({ text: item, img: newQ.itemImages?.[i] }));
      newQ.items = shuffleArrayWithSeed(zipped, qSeed).map(z => z.text);
      // Kita simpan gambar berdasarkan urutan asli, dan nanti dicari saat render
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
  const [isRefreshing, setIsRefreshing] = useState(false);
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
  const [isExamLocked, setIsExamLocked] = useState(false); 
  const [showNavModal, setShowNavModal] = useState(false); 
  const [isCheckingStatus, setIsCheckingStatus] = useState(false); 
  
  const [isLightMode, setIsLightMode] = useState(false);

  const [studentData, setStudentData] = useState<{ id: string; className: string } | null>(null);

  const violationsRef = useRef(0);
  const skipAutoSaveRef = useRef(true);
  const tabIdRef = useRef<string>("");

  const bgMain = isLightMode ? "bg-slate-100" : "bg-[#0B1120]";
  const bgCard = isLightMode ? "bg-white border-slate-200 shadow-md" : "bg-slate-800 border-slate-700 shadow-xl";
  const textPrimary = isLightMode ? "text-slate-900" : "text-white";
  const textSecondary = isLightMode ? "text-slate-600" : "text-slate-300";
  const textMuted = isLightMode ? "text-slate-500" : "text-slate-400";

  useEffect(() => {
    let tid = sessionStorage.getItem("ujianku_tab_id");
    if (!tid) {
      tid = crypto.randomUUID();
      sessionStorage.setItem("ujianku_tab_id", tid);
    }
    tabIdRef.current = tid;
  }, []);

  const loadInitialData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/siswa/login"); return; }

    const { data: profile } = await supabase.from("users").select("full_name, class_name").eq("id", user.id).single();
    if (!profile) { router.push("/siswa/login"); return; }

    const { data: existingResult } = await supabase.from("results").select("id").eq("exam_id", examId).eq("student_id", user.id).maybeSingle();
    if (existingResult) { alert("Anda sudah mengerjakan ujian ini."); router.push("/siswa"); return; }

    const found = await fetchExamForStudent(examId);
    if (!found || !found.isActive) { router.push("/siswa"); return; }

    const sessionId = `${examId}_${user.id}`;
    const tabId = tabIdRef.current;
    
    const { data: existingSession } = await supabase.from("active_sessions").select("*").eq("id", sessionId).single();
    
    let startedAt = new Date().toISOString();

    if (existingSession) {
      const isOtherDeviceActive = (Date.now() - new Date(existingSession.last_seen).getTime() < 15000) && existingSession.tab_id !== tabId;
      
      if (isOtherDeviceActive) {
        alert("Ujian ini sedang dikerjakan di perangkat/tab lain.");
        router.push("/siswa");
        return;
      }

      startedAt = existingSession.started_at;
      await supabase.from("active_sessions").update({ tab_id: tabId, last_seen: new Date().toISOString() }).eq("id", sessionId);

      if (existingSession.violations >= 3) {
        setIsExamLocked(true);
        setSelesai(true);
      }
    } else {
      await supabase.from("active_sessions").insert({
        id: sessionId, exam_id: examId, student_id: user.id,
        student_name: profile.full_name, class_name: profile.class_name || "-",
        current_question: 1, total_questions: found.questions.length,
        violations: 0, last_seen: new Date().toISOString(),
        started_at: startedAt, tab_id: tabId
      });
    }

    const randomizedExam = getRandomizedExam(found, user.id);
    setExam(randomizedExam);
    setNama(profile.full_name);
    setStudentData({ id: user.id, className: profile.class_name || "-" });

    const existing = getSession(examId);
    if (existing && existing.studentName === profile.full_name) {
      setJawaban(existing.answers);
      setViolations(existing.violations);
      violationsRef.current = existing.violations;
      
      const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
      const sisa = Math.max(0, found.duration - elapsed);
      setSisaWaktu(sisa);
      setIsResume(true);
      if (sisa <= 0) setSelesai(true);
    } else {
      const initialAnswers: Record<string, any> = {};
      randomizedExam.questions.forEach(q => {
        if (q.type === "ordering" && q.items) {
          // Simpan jawaban sebagai array objek { text, img }
          const zipped = q.items.map((text, i) => ({ text, img: q.itemImages?.[i] }));
          initialAnswers[q.id] = shuffleArrayWithSeed(zipped, user.id + q.id);
        }
      });

      saveSession({
        examId, studentId: user.id, studentName: profile.full_name,
        answers: initialAnswers, startedAt: startedAt, violations: 0, lastUpdated: new Date().toISOString()
      });
      setJawaban(initialAnswers);
      
      const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
      const sisa = Math.max(0, found.duration - elapsed);
      setSisaWaktu(sisa);
    }
    setLoading(false);
  }, [examId, router]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  async function handleRefreshSoal() {
    setIsRefreshing(true);
    try {
      const found = await fetchExamForStudent(examId);
      if (found) {
        const randomizedExam = getRandomizedExam(found, studentData?.id || "");
        setExam(randomizedExam);
        alert("Soal berhasil diperbarui!");
      }
    } catch (e) {
      alert("Gagal memuat ulang soal.");
    }
    setIsRefreshing(false);
  }

  useEffect(() => {
    if (!exam || !studentData || showStartPrompt || selesai || isExamLocked) return;
    const sync = async () => {
      const success = await syncActiveSession(
        `${exam.id}_${studentData.id}`, tabIdRef.current, nomorSoal + 1, violations
      );
      if (!success) {
        alert("Sesi ujian Anda telah berakhir.");
        router.push("/siswa");
      }
    };
    sync();
    const interval = setInterval(sync, 5000);
    return () => clearInterval(interval);
  }, [exam, studentData, nama, nomorSoal, violations, showStartPrompt, selesai, isExamLocked]);

  const handleViolation = useCallback((message: string) => {
    if (isExamLocked || selesai || isSubmitting) return;

    violationsRef.current += 1;
    const newViolationCount = violationsRef.current;
    setViolations(newViolationCount);

    const s = getSession(examId);
    if (s) saveSession({ ...s, violations: newViolationCount, lastUpdated: new Date().toISOString() });

    if (exam && studentData) {
      supabase.from("active_sessions").update({ violations: newViolationCount }).eq("id", `${exam.id}_${studentData.id}`).then();
    }

    if (newViolationCount >= 3) {
      setIsExamLocked(true);
      setSelesai(true);
      setShowWarning(false);
    } else {
      setShowWarning(true);
    }
  }, [examId, isExamLocked, selesai, isSubmitting, exam, studentData]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      if (!isFull && !showStartPrompt && !selesai && !isSubmitting && !isExamLocked) {
        handleViolation("Anda keluar dari mode layar penuh!");
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [showStartPrompt, selesai, isSubmitting, isExamLocked, handleViolation]);

  useEffect(() => {
    if (!exam || showStartPrompt || selesai || isExamLocked) return;
    const handleVisibilityChange = () => {
      if (document.hidden) handleViolation("Anda terdeteksi berpindah tab!");
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [exam, showStartPrompt, selesai, isExamLocked, handleViolation]);

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
    if (!exam || showStartPrompt || selesai || isExamLocked) return;
    if (exam.endTime) {
      const now = new Date().getTime();
      if (now > new Date(exam.endTime).getTime()) { submitExam(true); return; }
    }
    if (sisaWaktu <= 0) { submitExam(true); return; }
    const t = setTimeout(() => setSisaWaktu(w => w - 1), 1000);
    return () => clearTimeout(t);
  }, [sisaWaktu, exam, showStartPrompt, selesai, isExamLocked]);

  async function checkStatus() {
    if (!exam || !studentData) return;
    setIsCheckingStatus(true);
    try {
      const { data } = await supabase.from("active_sessions").select("violations").eq("id", `${exam.id}_${studentData.id}`).single();
      
      if (!data) {
        alert("Sesi Anda telah di-reset oleh guru. Silakan klik OK untuk mengulang dari awal.");
        clearSession(examId);
        router.push("/siswa");
        return;
      }

      if (data.violations < 3) {
        alert("Guru Anda telah membuka kunci. Ujian dilanjutkan!");
        setIsExamLocked(false);
        setSelesai(false);
        setViolations(data.violations);
        violationsRef.current = data.violations;
        setShowWarning(false);
      } else {
        alert("Ujian masih terkunci. Silakan hubungi guru Anda.");
      }
    } catch (e) {
      alert("Gagal mengecek status.");
    }
    setIsCheckingStatus(false);
  }

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
      if (auto) alert("Koneksi terputus.");
    }
  }

  if (loading || !exam) {
    return <div className={`min-h-screen flex items-center justify-center ${bgMain}`}><Loader2 className="w-8 h-8 animate-spin text-amber-400" /></div>;
  }

  if (isExamLocked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-950 text-white p-6 font-sans">
        <div className="w-24 h-24 rounded-full bg-red-500/20 border-4 border-red-500 flex items-center justify-center mb-8 animate-pulse">
          <Lock className="w-12 h-12 text-red-500" />
        </div>
        <h1 className="text-4xl font-black mb-4 text-center">Ujian Terkunci</h1>
        <p className="text-red-200 text-lg text-center max-w-lg mb-8 leading-relaxed">
          Anda telah melanggar aturan ujian sebanyak <b>3 kali</b>. Waktu ujian dihentikan sementara. Silakan hubungi guru Anda untuk membuka kunci.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={checkStatus} disabled={isCheckingStatus} className="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg">
            {isCheckingStatus ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />} Cek Status Kunci
          </button>
          <button onClick={() => router.push("/siswa")} className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition">Kembali ke Beranda</button>
        </div>
      </div>
    );
  }

  if (isSubmitting) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${bgMain} ${textPrimary} p-6`}>
        <Loader2 className="w-14 h-14 animate-spin text-amber-400 mb-6" />
        <h2 className="text-2xl font-bold mb-2">Mengirim Jawaban...</h2>
        <p className={`${textSecondary} text-center max-w-md`}>Sistem sedang menilai jawaban Anda. Jangan tutup atau refresh halaman ini.</p>
      </div>
    );
  }

  if (showStartPrompt) {
    return (
      <main className={`min-h-screen flex items-center justify-center p-6 ${bgMain} relative overflow-hidden`}>
        <div className="absolute top-0 left-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[100px] -translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
        
        <div className={`p-8 max-w-lg w-full text-center border ${bgCard} relative z-10 rounded-3xl`}>
          <div className={`w-20 h-20 rounded-full ${isLightMode ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-700'} flex items-center justify-center mx-auto mb-6 shadow-inner`}>
            <Lock className="w-10 h-10 text-amber-400" />
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${textPrimary}`}>{exam.title}</h1>
          <p className={`text-lg font-medium ${textSecondary} mb-8`}>{exam.questions.length} soal • {Math.floor(exam.duration / 60)} menit</p>
          
          <div className={`p-6 rounded-2xl text-left mb-8 border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-700'}`}>
            <p className="font-bold text-amber-400 text-lg mb-3 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Perhatian Ketat:</p>
            <ul className={`list-disc pl-5 space-y-2 text-base ${textSecondary}`}>
              <li>Ujian berjalan dalam mode <b className={textPrimary}>Layar Penuh</b>.</li>
              <li><b>Dilarang keluar dari layar penuh atau pindah tab.</b></li>
              <li>Sistem akan memberi peringatan 2x. Jika melanggar <b>3x, ujian otomatis terkunci</b>.</li>
              <li>Klik kanan, blok teks, dan Copy-Paste dinonaktifkan.</li>
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
    <div className={`h-screen w-full p-4 sm:p-6 font-sans flex flex-col overflow-hidden ${bgMain}`} style={{ userSelect: "none", WebkitUserSelect: "none", msUserSelect: "none" }}>
      
      {showNavModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className={`border w-full max-w-md max-h-[80vh] flex flex-col animate-fade-in-up rounded-3xl ${bgCard}`}>
            <div className={`p-5 border-b flex justify-between items-center rounded-t-3xl ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-700'}`}>
              <div>
                <h3 className={`text-lg font-bold ${textPrimary}`}>Navigasi Soal</h3>
                <p className={`text-xs ${textMuted}`}>{exam.questions.length} Butir Soal</p>
              </div>
              <button onClick={() => setShowNavModal(false)} className={`p-2 rounded-full transition ${isLightMode ? 'bg-slate-200 text-slate-600 hover:text-slate-900' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-5 gap-3">
                {exam.questions.map((q, i) => {
                  const answered = jawaban[q.id] !== undefined && (Array.isArray(jawaban[q.id]) ? jawaban[q.id].length > 0 : jawaban[q.id] !== "");
                  return (
                    <button key={q.id} onClick={() => { setNomorSoal(i); setShowNavModal(false); }} className={`h-11 rounded-xl font-bold text-base transition-all flex items-center justify-center ${i === nomorSoal ? "bg-amber-400 text-slate-900 shadow-[0_0_10px_rgba(251,191,36,0.4)] scale-110" : answered ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30" : isLightMode ? "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200" : "bg-slate-900 text-slate-500 border border-slate-700 hover:bg-slate-700"}`}>{i+1}</button>
                  );
                })}
              </div>
            </div>
            <div className={`p-4 border-t flex justify-between items-center rounded-b-3xl text-xs font-medium ${isLightMode ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-slate-900 border-slate-700 text-slate-400'}`}>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-amber-400"></div> Aktif</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/50"></div> Dijawab</div>
              <div className={`flex items-center gap-2`}><div className={`w-3 h-3 rounded border ${isLightMode ? 'bg-slate-100 border-slate-300' : 'bg-slate-900 border-slate-700'}`}></div> Kosong</div>
            </div>
          </div>
        </div>
      )}

      {showWarning && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className={`p-8 max-w-md w-full border-2 border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.3)] animate-fade-in-up rounded-3xl ${bgCard}`}>
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4 border border-red-500/30">
              <AlertTriangle className="w-8 h-8 text-red-500 animate-pulse" />
            </div>
            <h3 className={`text-2xl font-bold text-center mb-2 ${textPrimary}`}>Pelanggaran Terdeteksi!</h3>
            <p className={`text-sm ${textSecondary} text-center mb-6 leading-relaxed`}>Anda terdeteksi keluar dari layar ujian atau berpindah tab. Tindakan ini tercatat oleh sistem.</p>
            <div className={`rounded-xl p-5 text-center mb-6 border ${isLightMode ? 'bg-red-50 border-red-200' : 'bg-red-500/10 border-red-500/20'}`}>
              <p className={`text-xs font-semibold uppercase tracking-widest mb-1 ${isLightMode ? 'text-red-600' : 'text-red-400'}`}>Peringatan Ke-</p>
              <p className="text-5xl font-black text-red-500">{violations}<span className={`text-2xl font-normal ${isLightMode ? 'text-red-500' : 'text-red-400'}`}> / 3</span></p>
              {violations === 2 && <p className={`text-xs font-bold mt-3 animate-pulse ${isLightMode ? 'text-red-600' : 'text-red-400'}`}>⚠️ HATI-HATI! Satu pelanggaran lagi akan mengunci ujian Anda secara permanen.</p>}
            </div>
            <button onClick={() => { if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {}); setShowWarning(false); }} className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition shadow-lg shadow-red-600/30">Saya Mengerti, Kembali ke Ujian</button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
        
        <aside className="hidden lg:flex flex-col w-80 shrink-0 h-full gap-4">
          <div className={`p-5 shrink-0 rounded-2xl border ${bgCard}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${isLightMode ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-700'}`}>
                <span className="font-black text-amber-400 text-base">{nama.charAt(0)}</span>
              </div>
              <div className="min-w-0">
                <p className={`text-[10px] font-semibold uppercase tracking-wider ${textMuted}`}>Peserta</p>
                <p className={`font-bold text-sm truncate ${textPrimary}`}>{nama}</p>
              </div>
            </div>
            <div className={`px-4 py-3 rounded-xl border text-center ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-700'}`}>
              <p className={`text-xs font-semibold uppercase tracking-wider mb-1 flex items-center justify-center gap-1 ${textSecondary}`}><Clock className="w-3.5 h-3.5"/> Sisa Waktu</p>
              <p className={`font-black text-3xl tabular-nums tracking-tight ${sisaWaktu < 60 ? "text-red-500 animate-pulse" : "text-amber-500"}`}>{Math.floor(sisaWaktu/60)}:{(sisaWaktu%60).toString().padStart(2,'0')}</p>
            </div>
          </div>

          <div className={`p-5 flex-1 flex flex-col rounded-2xl border ${bgCard}`}>
            <div className="flex justify-between items-center mb-4 shrink-0">
              <p className={`text-sm font-semibold ${textSecondary}`}>Navigasi Soal</p>
              <p className={`text-xs ${textMuted}`}>{exam.questions.length} Butir</p>
            </div>
            <div className="grid grid-cols-5 gap-2 overflow-y-auto pr-1 flex-1 content-start">
              {exam.questions.map((q, i) => {
                const answered = jawaban[q.id] !== undefined && (Array.isArray(jawaban[q.id]) ? jawaban[q.id].length > 0 : jawaban[q.id] !== "");
                return <button key={q.id} onClick={() => setNomorSoal(i)} className={`h-10 rounded-lg font-bold text-sm transition-all flex items-center justify-center ${i === nomorSoal ? "bg-amber-400 text-slate-900 shadow-[0_0_10px_rgba(251,191,36,0.4)] scale-110" : answered ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30" : isLightMode ? "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200" : "bg-slate-900 text-slate-500 border border-slate-700 hover:bg-slate-700"}`}>{i+1}</button>;
              })}
            </div>
            <div className={`mt-6 pt-4 border-t shrink-0 ${isLightMode ? 'border-slate-200' : 'border-slate-700/50'}`}>
               <button onClick={() => submitExam(false)} className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-xl font-bold text-sm transition-all shadow-[0_0_15px_rgba(52,211,153,0.2)] flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4"/> Selesai & Kirim</button>
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col h-full overflow-hidden">
          
          <div className={`lg:hidden p-4 mb-4 flex justify-between items-center rounded-2xl border shrink-0 ${bgCard}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${isLightMode ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-700'}`}>
                <span className="font-black text-amber-400 text-base">{nama.charAt(0)}</span>
              </div>
              <div>
                <p className={`text-[10px] font-semibold uppercase tracking-wider ${textMuted}`}>Peserta</p>
                <p className={`font-bold text-sm truncate max-w-[100px] ${textPrimary}`}>{nama}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsLightMode(!isLightMode)} className={`p-2 rounded-xl border transition ${isLightMode ? 'bg-slate-100 border-slate-200 text-amber-600' : 'bg-slate-900 border-slate-700 text-amber-400'}`} title="Ganti Tema">
                {isLightMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
              <button onClick={handleRefreshSoal} disabled={isRefreshing} className={`p-2 rounded-xl border transition ${isLightMode ? 'bg-slate-100 border-slate-200 text-blue-600' : 'bg-slate-900 border-slate-700 text-blue-400'}`} title="Refresh Soal">
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={() => setShowNavModal(true)} className={`p-2 rounded-xl border transition ${isLightMode ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-slate-900 border-slate-700 text-amber-400'}`}>
                <LayoutGrid className="w-5 h-5" />
              </button>
              <div className={`text-right px-3 py-1.5 rounded-lg border ${isLightMode ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-700'}`}>
                <p className={`font-black text-xl tabular-nums tracking-tight ${sisaWaktu < 60 ? "text-red-500 animate-pulse" : "text-amber-500"}`}>{Math.floor(sisaWaktu/60)}:{(sisaWaktu%60).toString().padStart(2,'0')}</p>
              </div>
            </div>
          </div>

          <div className={`flex-1 p-6 sm:p-10 flex flex-col overflow-y-auto mb-4 border rounded-3xl ${bgCard}`}>
            <div className={`flex justify-between items-center mb-8 pb-4 border-b shrink-0 ${isLightMode ? 'border-slate-200' : 'border-slate-700'}`}>
              <p className={`text-sm sm:text-base font-bold uppercase tracking-wider ${textSecondary}`}>Soal {nomorSoal + 1} <span className={`font-normal ${textMuted}`}>dari {exam.questions.length}</span></p>
              <div className="flex items-center gap-2">
                {savedFlash && <span className={`text-xs font-semibold flex items-center gap-1 animate-fade-in-up ${isLightMode ? 'text-emerald-600' : 'text-emerald-400'}`}><CheckCircle2 className="w-4 h-4"/> Tersimpan</span>}
                <button onClick={() => setIsLightMode(!isLightMode)} className={`hidden lg:flex p-1.5 text-xs border rounded-lg transition items-center gap-1 ${isLightMode ? 'bg-slate-100 border-slate-200 text-amber-600 hover:bg-slate-200' : 'bg-slate-900 border-slate-700 text-amber-400 hover:text-white'}`}>
                  {isLightMode ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />} Tema
                </button>
                <button onClick={handleRefreshSoal} disabled={isRefreshing} className={`hidden lg:flex p-1.5 text-xs border rounded-lg transition items-center gap-1 ${isLightMode ? 'bg-slate-100 border-slate-200 text-blue-600 hover:bg-slate-200' : 'bg-slate-900 border-slate-700 text-blue-400 hover:text-white'}`}>
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh Soal
                </button>
              </div>
            </div>
            
            <div className={`rich-text-content soal-pertanyaan font-medium mb-10 shrink-0 prose prose-sm sm:prose-base max-w-none ${textPrimary}`} dangerouslySetInnerHTML={{ __html: soal.question }} />
            {soal.image && <img src={soal.image} className={`max-h-64 mb-10 rounded-xl border shadow-sm shrink-0 object-contain self-start ${isLightMode ? 'border-slate-300' : 'border-slate-600'}`} />}

            <div className="space-y-4 shrink-0">
              {soal.type === "multiple_choice" && soal.options?.map((opt, i) => {
                const originalIdx = soal._optIdx?.[i] ?? i;
                const identifier = opt || `Opsi ${originalIdx + 1}`;
                const img = soal.optionImages?.[i];
                const isSelected = ans === identifier;
                return (
                  <button key={i} onClick={() => updateJawaban(soal.id, identifier)} className={`w-full text-left p-5 rounded-2xl border-2 flex items-center gap-4 transition-all duration-200 ${isSelected ? (isLightMode ? "border-amber-500 bg-amber-50" : "border-amber-400 bg-amber-400/10 shadow-[0_0_15px_rgba(251,191,36,0.1)]") : (isLightMode ? "border-slate-200 bg-white hover:border-slate-300" : "border-slate-600 bg-slate-900/50 hover:border-slate-500")}`}>
                    <span className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0 transition-colors ${isSelected ? "bg-amber-400 text-slate-900" : isLightMode ? "bg-slate-100 text-slate-500" : "bg-slate-700 text-slate-300"}`}>{String.fromCharCode(65+i)}</span>
                    {img && <img src={img} className="h-20 object-contain rounded-lg border border-slate-300 bg-white p-1" alt={`Opsi ${i+1}`} />}
                    <div className={`rich-text-content text-lg sm:text-xl prose prose-sm max-w-none ${isSelected ? (isLightMode ? 'text-amber-900 font-medium' : 'text-amber-100 font-medium') : (isLightMode ? 'text-slate-700' : 'text-slate-200')}`} dangerouslySetInnerHTML={{ __html: opt }} />
                  </button>
                );
              })}

              {soal.type === "complex_mc" && soal.options?.map((opt, i) => {
                const originalIdx = soal._optIdx?.[i] ?? i;
                const identifier = opt || `Opsi ${originalIdx + 1}`;
                const img = soal.optionImages?.[i];
                const selected = Array.isArray(ans) && ans.includes(identifier);
                return (
                  <button key={i} onClick={() => {
                    const curr = Array.isArray(ans) ? ans : [];
                    updateJawaban(soal.id, selected ? curr.filter(a => a !== identifier) : [...curr, identifier]);
                  }} className={`w-full text-left p-5 rounded-2xl border-2 flex items-center gap-4 transition-all duration-200 ${selected ? (isLightMode ? "border-amber-500 bg-amber-50" : "border-amber-400 bg-amber-400/10 shadow-[0_0_15px_rgba(251,191,36,0.1)]") : (isLightMode ? "border-slate-200 bg-white hover:border-slate-300" : "border-slate-600 bg-slate-900/50 hover:border-slate-500")}`}>
                    <div className={`w-8 h-8 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${selected ? "bg-amber-400 border-amber-400 text-slate-900" : isLightMode ? "border-slate-300" : "border-slate-500"}`}>{selected && <CheckCircle2 className="w-5 h-5"/>}</div>
                    {img && <img src={img} className="h-20 object-contain rounded-lg border border-slate-300 bg-white p-1" alt={`Opsi ${i+1}`} />}
                    <div className={`rich-text-content text-lg sm:text-xl prose prose-sm max-w-none ${selected ? (isLightMode ? 'text-amber-900 font-medium' : 'text-amber-100 font-medium') : (isLightMode ? 'text-slate-700' : 'text-slate-200')}`} dangerouslySetInnerHTML={{ __html: opt }} />
                  </button>
                );
              })}

              {soal.type === "true_false" && (
                <div className="grid grid-cols-2 gap-4">
                  {[true, false].map(val => {
                    const isSelected = ans === val;
                    return (
                      <button key={String(val)} onClick={() => updateJawaban(soal.id, val)} className={`py-6 rounded-2xl border-2 font-bold text-lg transition-all duration-200 ${isSelected ? (isLightMode ? "border-amber-500 bg-amber-50 text-amber-700" : "border-amber-400 bg-amber-400/10 text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.1)]") : (isLightMode ? "border-slate-200 bg-white text-slate-600 hover:border-slate-300" : "border-slate-600 bg-slate-900/50 text-slate-300 hover:border-slate-500")}`}>{val ? "BENAR" : "SALAH"}</button>
                    );
                  })}
                </div>
              )}

              {soal.type === "multi_true_false" && soal.statements?.map((st, i) => {
                const curr = ans || {};
                return (
                  <div key={i} className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 border-2 rounded-2xl gap-4 ${isLightMode ? 'border-slate-200 bg-white' : 'border-slate-600 bg-slate-900/50'}`}>
                    <div className={`rich-text-content text-base sm:text-lg flex-1 prose prose-sm max-w-none ${isLightMode ? 'text-slate-700' : 'text-slate-200'}`} dangerouslySetInnerHTML={{ __html: st.text }} />
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => updateJawaban(soal.id, {...curr, [i]: true})} className={`px-6 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${curr[i] === true ? "bg-amber-400 border-amber-400 text-slate-900" : isLightMode ? "border-slate-300 text-slate-500 hover:border-slate-400" : "border-slate-600 text-slate-400 hover:border-slate-500"}`}>BENAR</button>
                      <button onClick={() => updateJawaban(soal.id, {...curr, [i]: false})} className={`px-6 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${curr[i] === false ? "bg-amber-400 border-amber-400 text-slate-900" : isLightMode ? "border-slate-300 text-slate-500 hover:border-slate-400" : "border-slate-600 text-slate-400 hover:border-slate-500"}`}>SALAH</button>
                    </div>
                  </div>
                );
              })}

              {soal.type === "matching" && (
                <div className="space-y-4">
                  {soal.pairs?.map((p, i) => {
                    const curr = ans || {};
                    const selectedValue = curr[i];
                    return (
                      <div key={i} className={`flex flex-col sm:flex-row gap-4 items-center p-4 border-2 rounded-xl ${isLightMode ? 'border-slate-200 bg-slate-50' : 'border-slate-600 bg-slate-900/50'}`}>
                        <div className="flex-1 w-full flex items-center gap-3">
                          <span className="w-6 text-center font-bold text-amber-500">{i+1}.</span>
                          {p.leftImage && <img src={p.leftImage} className="h-16 w-16 object-contain bg-white rounded-lg p-1 border border-slate-300" />}
                          {p.left && <div className={`rich-text-content flex-1 text-base ${isLightMode ? 'text-slate-700' : 'text-slate-200'}`} dangerouslySetInnerHTML={{ __html: p.left }} />}
                        </div>
                        
                        <div className="flex-1 w-full flex items-center gap-2">
                          <span className={textMuted}>→</span>
                          <select 
                            value={selectedValue || ""} 
                            onChange={(e) => updateJawaban(soal.id, {...curr, [i]: e.target.value})} 
                            className={`flex-1 p-3 rounded-lg border-2 text-base focus:border-amber-500 focus:outline-none transition ${isLightMode ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-600 text-white'} ${selectedValue ? 'border-amber-400/50' : ''}`}
                          >
                            <option value="" disabled>-- Pilih Pasangan --</option>
                            {soal.pairs?.map((pr, idx) => (
                              <option key={idx} value={pr.right}>{pr.right ? pr.right.replace(/<[^>]*>?/gm, '') : `[Gambar ${idx+1}]`}</option>
                            ))}
                          </select>
                          
                          {selectedValue && soal.pairs?.find(pr => pr.right === selectedValue)?.rightImage && (
                            <img src={soal.pairs.find(pr => pr.right === selectedValue)!.rightImage} className="h-16 w-16 object-contain bg-white rounded-lg p-1 border border-slate-300" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {soal.type === "ordering" && (
                <div className="space-y-3">
                  {(ans && Array.isArray(ans) ? ans : soal.items?.map((text, i) => ({ text, img: soal.itemImages?.[i] })) || []).map((item, i, arr) => {
                    const text = typeof item === 'string' ? item : item.text;
                    const img = typeof item === 'string' ? undefined : item.img;
                    return (
                      <div key={i} className={`flex gap-4 items-center p-4 border-2 rounded-xl ${isLightMode ? 'border-slate-200 bg-white' : 'border-slate-600 bg-slate-900/50'}`}>
                        <span className="w-8 text-center font-bold text-amber-500 text-lg">{i+1}</span>
                        {img && <img src={img} className="h-16 object-contain bg-white rounded-lg p-1 border border-slate-300" />}
                        <div className={`rich-text-content flex-1 text-base prose prose-sm max-w-none ${isLightMode ? 'text-slate-700' : 'text-slate-200'}`} dangerouslySetInnerHTML={{ __html: text }} />
                        <div className="flex flex-col gap-1">
                          <button disabled={i===0} onClick={() => { const newArr = [...arr]; [newArr[i-1], newArr[i]] = [newArr[i], newArr[i-1]]; updateJawaban(soal.id, newArr); }} className={`p-2 rounded-lg transition disabled:opacity-30 ${isLightMode ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>▲</button>
                          <button disabled={i===arr.length-1} onClick={() => { const newArr = [...arr]; [newArr[i+1], newArr[i]] = [newArr[i], newArr[i+1]]; updateJawaban(soal.id, newArr); }} className={`p-2 rounded-lg transition disabled:opacity-30 ${isLightMode ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>▼</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {soal.type === "short_answer" && (
                <input type="text" value={ans || ""} onChange={(e) => updateJawaban(soal.id, e.target.value)} placeholder="Ketik jawaban Anda..." className={`w-full p-5 border-2 rounded-2xl text-xl focus:border-amber-500 focus:outline-none transition ${isLightMode ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400' : 'bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500'}`} />
              )}

              {soal.type === "essay" && (
                <div>
                  <textarea rows={10} value={ans || ""} onChange={(e) => updateJawaban(soal.id, e.target.value)} placeholder="Ketik jawaban panjang Anda di sini..." className={`w-full p-5 border-2 rounded-2xl text-lg focus:border-amber-500 focus:outline-none resize-none transition ${isLightMode ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400' : 'bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500'}`} />
                  <p className={`text-sm font-medium mt-2 ${isLightMode ? 'text-amber-600' : 'text-amber-500'}`}>Jawaban esai akan dinilai manual oleh guru.</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between gap-4 shrink-0">
            <button onClick={() => setNomorSoal(n => Math.max(0, n-1))} disabled={nomorSoal===0} className={`flex-1 py-4 px-6 rounded-xl font-bold text-base border-2 transition disabled:opacity-30 flex items-center justify-center gap-2 ${isLightMode ? 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}><ChevronLeft className="w-5 h-5"/> Sebelumnya</button>
            
            {nomorSoal === exam.questions.length - 1 ? (
              <button onClick={() => submitExam(false)} className="flex-1 py-4 px-6 rounded-xl font-bold text-base text-slate-900 bg-emerald-400 hover:bg-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.2)] transition flex items-center justify-center gap-2"><CheckCircle2 className="w-5 h-5"/> Selesai & Kirim</button>
            ) : (
              <button onClick={() => setNomorSoal(n => Math.min(exam.questions.length-1, n+1))} className="flex-1 py-4 px-6 rounded-xl font-bold text-base text-slate-900 bg-amber-400 hover:bg-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.2)] transition flex items-center justify-center gap-2">Selanjutnya <ChevronRight className="w-5 h-5"/></button>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}