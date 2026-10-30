import { supabase } from "./supabase";
import type { Exam, Question, ExamResult, ActiveSession } from "./types";

function safeParse(json: any) {
  if (typeof json === 'string') {
    try { return JSON.parse(json); } catch(e) { return {}; }
  }
  return json || {};
}

function mapDbQuestionToQuestion(dbQ: any): Question {
  const correctAns = safeParse(dbQ.correct_answer);
  const opts = safeParse(dbQ.options);
  const optImgs = safeParse(dbQ.option_images);

  return {
    id: dbQ.id, type: dbQ.type, question: dbQ.question, image: dbQ.image_url,
    options: Array.isArray(opts) ? opts : undefined, 
    optionImages: Array.isArray(optImgs) ? optImgs : undefined, 
    ...correctAns, 
    subject: dbQ.subject || undefined,
    topic: dbQ.topic || undefined,
  };
}

function mapQuestionToDb(examId: string, q: Question, index: number) {
  return {
    id: q.id, exam_id: examId, type: q.type, question: q.question, image_url: q.image,
    options: q.options || null, option_images: q.optionImages || null, order_index: index,
    correct_answer: {
      correctAnswer: q.correctAnswer, correctAnswers: q.correctAnswers, trueFalseAnswer: q.trueFalseAnswer,
      statements: q.statements, pairs: q.pairs, items: q.items, acceptedAnswers: q.acceptedAnswers,
    }
  };
}

export async function fetchExams(): Promise<Exam[]> {
  const { data: exams, error } = await supabase.from("exams").select("*, questions(*)").order("created_at", { ascending: false });
  if (error) return [];
  return exams.map((e: any) => ({
    id: e.id, title: e.title, subject: e.subject, duration: e.duration, isActive: e.is_active, createdAt: e.created_at,
    token: e.token, startTime: e.start_time, endTime: e.end_time,
    questions: (e.questions || []).sort((a: any, b: any) => a.order_index - b.order_index).map(mapDbQuestionToQuestion),
  }));
}

export async function fetchExamById(id: string): Promise<Exam | null> {
  const { data: exam, error } = await supabase.from("exams").select("*, questions(*)").eq("id", id).single();
  if (error || !exam) return null;
  return {
    id: exam.id, title: exam.title, subject: exam.subject, duration: exam.duration, isActive: exam.is_active, createdAt: exam.created_at,
    token: exam.token, startTime: exam.start_time, endTime: exam.end_time,
    questions: (exam.questions || []).sort((a: any, b: any) => a.order_index - b.order_index).map(mapDbQuestionToQuestion),
  };
}

export async function fetchExamForStudent(id: string): Promise<Exam | null> {
  const { data: exam, error } = await supabase.from("exams").select("*, questions(*)").eq("id", id).single();
  if (error || !exam) return null;

  return {
    id: exam.id, title: exam.title, subject: exam.subject, duration: exam.duration, isActive: exam.is_active, createdAt: exam.created_at,
    token: exam.token, startTime: exam.start_time, endTime: exam.end_time,
    questions: (exam.questions || []).sort((a: any, b: any) => a.order_index - b.order_index).map((dbQ: any) => {
        const correctAns = safeParse(dbQ.correct_answer);
        const opts = safeParse(dbQ.options);
        const optImgs = safeParse(dbQ.option_images);
        
        const q: Question = {
          id: dbQ.id, type: dbQ.type, question: dbQ.question, image: dbQ.image_url,
          options: Array.isArray(opts) ? opts : undefined, 
          optionImages: Array.isArray(optImgs) ? optImgs : undefined,
        };
        
        if (q.type === "multi_true_false" && correctAns.statements) q.statements = correctAns.statements.map((st: any) => ({ text: st.text }));
        if (q.type === "matching" && correctAns.pairs) q.pairs = correctAns.pairs;
        if (q.type === "ordering" && correctAns.items) q.items = correctAns.items;
        
        return q;
      }),
  };
}

export async function saveExam(exam: Exam): Promise<boolean> {
  const { error: examError } = await supabase.from("exams").upsert({
    id: exam.id, title: exam.title, subject: exam.subject, duration: exam.duration, is_active: exam.isActive,
    token: exam.token || null, start_time: exam.startTime || null, end_time: exam.endTime || null,
  });
  if (examError) return false;

  await supabase.from("questions").delete().eq("exam_id", exam.id);
  if (exam.questions.length > 0) {
    const dbQuestions = exam.questions.map((q, i) => mapQuestionToDb(exam.id, q, i));
    const { error: qError } = await supabase.from("questions").insert(dbQuestions);
    if (qError) return false;
  }
  return true;
}

export async function removeExam(id: string): Promise<boolean> {
  const { error } = await supabase.from("exams").delete().eq("id", id);
  return !error;
}

export async function duplicateExam(examId: string): Promise<boolean> {
  const exam = await fetchExamById(examId);
  if (!exam) return false;

  const newExam: Exam = {
    ...exam, id: crypto.randomUUID(), title: `${exam.title} (Salinan)`, isActive: false,
    token: undefined, startTime: undefined, endTime: undefined,
    questions: exam.questions.map(q => ({ ...q, id: crypto.randomUUID() }))
  };
  return await saveExam(newExam);
}

// --- HASIL UJIAN & MONITORING ---
export async function submitResult(result: ExamResult): Promise<boolean> {
  await supabase.from("results").delete().eq("exam_id", result.examId).eq("student_id", result.studentId);
  const { error } = await supabase.from("results").insert({
    id: result.id, exam_id: result.examId, student_id: result.studentId, score: result.score,
    correct: result.correct, total: result.total, violations: result.violations,
    submitted_at: result.submittedAt, answers: result.answers,
  });
  return !error;
}

export async function fetchResultsByExam(examId: string): Promise<ExamResult[]> {
  const { data, error } = await supabase.from("results").select("*, users(full_name, class_name)").eq("exam_id", examId).order("score", { ascending: false });
  if (error) return [];
  return data.map((r: any) => ({
    id: r.id, examId: r.exam_id, examTitle: "", studentId: r.student_id,
    studentName: r.users?.full_name || "Siswa", className: r.users?.class_name || "-",
    score: r.score, correct: r.correct, total: r.total, violations: r.violations,
    submittedAt: r.submitted_at, answers: safeParse(r.answers), manualGrades: safeParse(r.manual_grades),
  }));
}

export async function fetchStudentResults(studentId: string): Promise<ExamResult[]> {
  const { data, error } = await supabase.from("results").select("*, exams(title)").eq("student_id", studentId).order("submitted_at", { ascending: false });
  if (error) return [];
  return data.map((r: any) => ({
    id: r.id, examId: r.exam_id, examTitle: r.exams?.title || "Ujian",
    studentId: r.student_id, studentName: "", className: "",
    score: r.score, correct: r.correct, total: r.total, violations: r.violations,
    submittedAt: r.submitted_at,
  }));
}

export async function updateResultGrades(resultId: string, newScore: number, manualGrades: Record<string, number>): Promise<boolean> {
  const { error } = await supabase.from("results").update({ score: newScore, manual_grades: manualGrades }).eq("id", resultId);
  return !error;
}

export async function syncActiveSession(
  sessionId: string, 
  tabId: string, 
  currentQuestion: number, 
  violations: number
): Promise<boolean> {
  const { data, error } = await supabase
    .from("active_sessions")
    .update({
      current_question: currentQuestion,
      violations: violations,
      last_seen: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("tab_id", tabId)
    .select();

  if (error) {
    console.error("Sync error:", error);
    return false;
  }
  if (!data || data.length === 0) {
    return false; // Sesi terhapus atau diambil alih perangkat lain
  }
  return true;
}

export async function removeActiveSession(sessionId: string): Promise<void> {
  await supabase.from("active_sessions").delete().eq("id", sessionId);
}

// --- FUNGSI BANK SOAL ---
export async function fetchBankQuestions(): Promise<Question[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .is("exam_id", null) 
    .eq("owner_id", user.id) 
    .order("subject", { ascending: true });

  if (error) return [];
  return data.map(mapDbQuestionToQuestion);
}

// Simpan Satu Soal
export async function saveQuestionToBank(q: Question, subject: string, topic: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const dbQ = {
    id: crypto.randomUUID(), exam_id: null, owner_id: user.id, subject: subject, topic: topic,
    type: q.type, question: q.question, image_url: q.image,
    options: q.options || null, option_images: q.optionImages || null, order_index: 0,
    correct_answer: {
      correctAnswer: q.correctAnswer, correctAnswers: q.correctAnswers, trueFalseAnswer: q.trueFalseAnswer,
      statements: q.statements, pairs: q.pairs, items: q.items, acceptedAnswers: q.acceptedAnswers,
    }
  };

  const { error } = await supabase.from("questions").insert(dbQ);
  return !error;
}

// Simpan Banyak Soal (Bulk)
export async function bulkSaveToBank(questions: Question[], subject: string, topic: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const dbQs = questions.map(q => ({
    id: crypto.randomUUID(), exam_id: null, owner_id: user.id, subject: subject, topic: topic,
    type: q.type, question: q.question, image_url: q.image,
    options: q.options || null, option_images: q.optionImages || null, order_index: 0,
    correct_answer: {
      correctAnswer: q.correctAnswer, correctAnswers: q.correctAnswers, trueFalseAnswer: q.trueFalseAnswer,
      statements: q.statements, pairs: q.pairs, items: q.items, acceptedAnswers: q.acceptedAnswers,
    }
  }));

  const { error } = await supabase.from("questions").insert(dbQs);
  return !error;
}

export async function deleteBankQuestion(id: string): Promise<boolean> {
  const { error } = await supabase.from("questions").delete().eq("id", id);
  return !error;
}

// --- FUNGSI PENGATURAN SEKOLAH ---
export async function fetchAppSettings(): Promise<AppSettings> {
  const { data } = await supabase.from("app_settings").select("*").eq("id", 1).single();
  return {
    schoolName: data?.school_name || "Nama Sekolah",
    schoolLogoUrl: data?.school_logo_url || null,
  };
}

export async function updateAppSettings(schoolName: string, schoolLogoUrl: string | null): Promise<boolean> {
  const { error } = await supabase
    .from("app_settings")
    .update({ school_name: schoolName, school_logo_url: schoolLogoUrl })
    .eq("id", 1);
  
  if (error) {
    console.error("Gagal update pengaturan:", error);
    return false;
  }
  return true;
}