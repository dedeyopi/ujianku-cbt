import { supabase } from "./supabase";
import type { Exam, Question, ExamResult } from "./types";

// --- FUNGSI BANTU (Mapping) ---
function mapDbQuestionToQuestion(dbQ: any): Question {
  return {
    id: dbQ.id,
    type: dbQ.type,
    question: dbQ.question,
    image: dbQ.image_url,
    options: dbQ.options,
    optionImages: dbQ.option_images,
    ...dbQ.correct_answer, 
  };
}

function mapQuestionToDb(examId: string, q: Question, index: number) {
  return {
    id: q.id,
    exam_id: examId,
    type: q.type,
    question: q.question,
    image_url: q.image,
    options: q.options || null,
    option_images: q.optionImages || null,
    order_index: index,
    correct_answer: {
      correctAnswer: q.correctAnswer,
      correctAnswers: q.correctAnswers,
      trueFalseAnswer: q.trueFalseAnswer,
      statements: q.statements,
      pairs: q.pairs,
      items: q.items,
      acceptedAnswers: q.acceptedAnswers,
    }
  };
}

// --- CRUD UJIAN ---
export async function fetchExams(): Promise<Exam[]> {
  const { data: exams, error } = await supabase
    .from("exams")
    .select("*, questions(*)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Gagal mengambil ujian:", error);
    return [];
  }

  return exams.map((e: any) => ({
    id: e.id,
    title: e.title,
    subject: e.subject,
    duration: e.duration,
    isActive: e.is_active,
    createdAt: e.created_at,
    questions: (e.questions || [])
      .sort((a: any, b: any) => a.order_index - b.order_index)
      .map(mapDbQuestionToQuestion),
  }));
}

export async function fetchExamById(id: string): Promise<Exam | null> {
  const { data: exam, error } = await supabase
    .from("exams")
    .select("*, questions(*)")
    .eq("id", id)
    .single();

  if (error || !exam) return null;

  return {
    id: exam.id,
    title: exam.title,
    subject: exam.subject,
    duration: exam.duration,
    isActive: exam.is_active,
    createdAt: exam.created_at,
    questions: (exam.questions || [])
      .sort((a: any, b: any) => a.order_index - b.order_index)
      .map(mapDbQuestionToQuestion),
  };
}

export async function saveExam(exam: Exam): Promise<boolean> {
  // 1. Simpan/Update info Ujian
  const { error: examError } = await supabase.from("exams").upsert({
    id: exam.id,
    title: exam.title,
    subject: exam.subject,
    duration: exam.duration,
    is_active: exam.isActive,
  });

  if (examError) {
    console.error("Gagal simpan ujian:", examError);
    return false;
  }

  // 2. Sinkronisasi Soal (Hapus yang lama, masukkan yang baru)
  await supabase.from("questions").delete().eq("exam_id", exam.id);
  
  if (exam.questions.length > 0) {
    const dbQuestions = exam.questions.map((q, i) => mapQuestionToDb(exam.id, q, i));
    const { error: qError } = await supabase.from("questions").insert(dbQuestions);
    if (qError) {
      console.error("Gagal simpan soal:", qError);
      return false;
    }
  }

  return true;
}

export async function removeExam(id: string): Promise<boolean> {
  const { error } = await supabase.from("exams").delete().eq("id", id);
  return !error;
}

// --- FUNGSI SIMPAN HASIL UJIAN ---

export async function submitResult(result: ExamResult): Promise<boolean> {
  // 1. Hapus hasil lama jika siswa ini sudah pernah mengerjakan (untuk jaga-jaga ulangan)
  await supabase
    .from("results")
    .delete()
    .eq("exam_id", result.examId)
    .eq("student_id", result.studentId);

  // 2. Masukkan data hasil baru
  const { error } = await supabase.from("results").insert({
    id: result.id,
    exam_id: result.examId,
    student_id: result.studentId,
    score: result.score,
    correct: result.correct,
    total: result.total,
    violations: result.violations,
    submitted_at: result.submittedAt,
    answers: result.answers,
  });
  
  if (error) {
    console.error("Gagal menyimpan hasil:", error);
    return false;
  }
  return true;
}

// --- FUNGSI AMBIL HASIL UJIAN UNTUK GURU ---
export async function fetchResultsByExam(examId: string): Promise<ExamResult[]> {
  // Kita ambil data results dan join dengan tabel users untuk dapat nama & kelas
  const { data, error } = await supabase
    .from("results")
    .select(`
      *,
      users (
        full_name,
        class_name
      )
    `)
    .eq("exam_id", examId)
    .order("score", { ascending: false }); // Urutkan dari nilai tertinggi

  if (error) {
    console.error("Gagal mengambil hasil ujian:", error);
    return [];
  }

  return data.map((r: any) => ({
    id: r.id,
    examId: r.exam_id,
    examTitle: "", // Diisi nanti oleh halaman UI
    studentId: r.student_id,
    studentName: r.users?.full_name || "Siswa Tanpa Nama",
    className: r.users?.class_name || "-",
    score: r.score,
    correct: r.correct,
    total: r.total,
    violations: r.violations,
    submittedAt: r.submitted_at,
    answers: r.answers,
  }));
}