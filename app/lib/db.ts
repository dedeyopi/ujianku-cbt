import { supabase } from "./supabase";
import type { Exam, Question, ExamResult, ActiveSession } from "./types";

// --- FUNGSI BANTU (Mapping) ---
function mapDbQuestionToQuestion(dbQ: any): Question {
  return {
    id: dbQ.id, type: dbQ.type, question: dbQ.question, image: dbQ.image_url,
    options: dbQ.options, optionImages: dbQ.option_images, ...dbQ.correct_answer, 
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

// --- CRUD UJIAN ---
export async function fetchExams(): Promise<Exam[]> {
  const { data: exams, error } = await supabase.from("exams").select("*, questions(*)").order("created_at", { ascending: false });
  if (error) return [];
  return exams.map((e: any) => ({
    id: e.id, title: e.title, subject: e.subject, duration: e.duration, isActive: e.is_active, createdAt: e.created_at,
    questions: (e.questions || []).sort((a: any, b: any) => a.order_index - b.order_index).map(mapDbQuestionToQuestion),
  }));
}

export async function fetchExamById(id: string): Promise<Exam | null> {
  const { data: exam, error } = await supabase.from("exams").select("*, questions(*)").eq("id", id).single();
  if (error || !exam) return null;
  return {
    id: exam.id, title: exam.title, subject: exam.subject, duration: exam.duration, isActive: exam.is_active, createdAt: exam.created_at,
    questions: (exam.questions || []).sort((a: any, b: any) => a.order_index - b.order_index).map(mapDbQuestionToQuestion),
  };
}

export async function saveExam(exam: Exam): Promise<boolean> {
  const { error: examError } = await supabase.from("exams").upsert({
    id: exam.id, title: exam.title, subject: exam.subject, duration: exam.duration, is_active: exam.isActive,
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
    ...exam,
    id: crypto.randomUUID(),
    title: `${exam.title} (Salinan)`,
    isActive: false,
    questions: exam.questions.map(q => ({ ...q, id: crypto.randomUUID() }))
  };
  
  return await saveExam(newExam);
}

// --- HASIL UJIAN ---
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
    submittedAt: r.submitted_at, answers: r.answers, manualGrades: r.manual_grades,
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
// --- FUNGSI LIVE MONITOR ---
export async function syncActiveSession(session: ActiveSession): Promise<void> {
  const { error } = await supabase.from("active_sessions").upsert({
    id: session.id,
    exam_id: session.examId,
    student_id: session.studentId,
    student_name: session.studentName,
    class_name: session.className,
    current_question: session.currentQuestion,
    total_questions: session.totalQuestions,
    violations: session.violations,
    last_seen: new Date().toISOString(),
  });
  if (error) {
    console.error("Gagal sinkronisasi Live Monitor:", error.message);
  }
}

export async function removeActiveSession(sessionId: string): Promise<void> {
  await supabase.from("active_sessions").delete().eq("id", sessionId);
}