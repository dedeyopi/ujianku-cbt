import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../lib/supabaseAdmin"; // Perbaikan: Hanya 2 titik
import type { Question } from "../../lib/types"; // Perbaikan: Hanya 2 titik

// Fungsi penilaian (sama seperti sebelumnya, tapi berjalan di server)
function isJawabanBenar(q: Question, jawabanSiswa: any): boolean {
  if (jawabanSiswa === undefined || jawabanSiswa === null) return false;
  const normalize = (s: string) => String(s).trim().toLowerCase();
  
  const correctData = (q as any).correct_answer || {};

  switch (q.type) {
    case "multiple_choice": return jawabanSiswa === correctData.correctAnswer;
    case "complex_mc":
      if (!Array.isArray(jawabanSiswa) || !correctData.correctAnswers) return false;
      if (jawabanSiswa.length !== correctData.correctAnswers.length) return false;
      return jawabanSiswa.every(ans => correctData.correctAnswers.includes(ans));
    case "true_false": return jawabanSiswa === correctData.trueFalseAnswer;
    case "multi_true_false":
      if (!correctData.statements) return false;
      return correctData.statements.every((st: any, i: number) => jawabanSiswa[i] === st.isTrue);
    case "matching":
      if (!correctData.pairs || !jawabanSiswa) return false;
      return correctData.pairs.every((p: any) => jawabanSiswa[p.left] === p.right);
    case "ordering":
      if (!correctData.items || !Array.isArray(jawabanSiswa)) return false;
      return correctData.items.every((item: string, i: number) => jawabanSiswa[i] === item);
    case "short_answer":
      const accepted = correctData.acceptedAnswers || [];
      return accepted.some((a: string) => normalize(a) === normalize(jawabanSiswa));
    case "essay": return false; 
    default: return false;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { examId, studentId, answers, violations } = body;

    if (!examId || !studentId) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    // 1. Ambil data soal ASLI (termasuk kunci jawaban) dari database
    const { data: dbExam, error } = await supabaseAdmin
      .from("exams")
      .select("*, questions(*), users(full_name, class_name)")
      .eq("id", examId)
      .single();

    if (error || !dbExam) {
      return NextResponse.json({ error: "Ujian tidak ditemukan" }, { status: 404 });
    }

    // 2. Hitung nilai
    let benar = 0;
    const questions = dbExam.questions.sort((a: any, b: any) => a.order_index - b.order_index);
    
    questions.forEach((dbQ: any) => {
      // Bentuk objek Question dengan kunci jawaban untuk dicek
      const q: Question = { id: dbQ.id, type: dbQ.type, question: dbQ.question, ...dbQ.correct_answer };
      if (isJawabanBenar(q, answers[dbQ.id])) {
        benar++;
      }
    });

    const totalSoal = questions.length;
    const nilai = Math.round((benar / totalSoal) * 100);

    // 3. Simpan hasil ke database
    const { error: insertError } = await supabaseAdmin.from("results").insert({
      id: crypto.randomUUID(),
      exam_id: examId,
      student_id: studentId,
      score: nilai,
      correct: benar,
      total: totalSoal,
      violations: violations || 0,
      answers: answers,
      submitted_at: new Date().toISOString(),
    });

    if (insertError) throw insertError;

    // 4. Kembalikan hasil ke browser siswa
    return NextResponse.json({ 
      success: true, 
      score: nilai, 
      correct: benar, 
      total: totalSoal,
      studentName: dbExam.users?.full_name 
    });

  } catch (err: any) {
    console.error("Grading Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}