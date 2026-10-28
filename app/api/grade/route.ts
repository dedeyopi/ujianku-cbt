import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../lib/supabaseAdmin";
import { isJawabanBenar } from "../../lib/grading";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { examId, studentId, answers, violations } = body;

    if (!examId || !studentId) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    const { data: dbExam, error } = await supabaseAdmin
      .from("exams")
      .select("*, questions(*), users(full_name, class_name)")
      .eq("id", examId)
      .single();

    if (error || !dbExam) return NextResponse.json({ error: "Ujian tidak ditemukan" }, { status: 404 });

    let benar = 0;
    const questions = dbExam.questions.sort((a: any, b: any) => a.order_index - b.order_index);
    
    questions.forEach((dbQ: any) => {
      const q = { 
        id: dbQ.id, 
        type: dbQ.type, 
        question: dbQ.question, 
        ...(dbQ.correct_answer || {}) 
      };
      
      if (isJawabanBenar(q as any, answers[dbQ.id])) {
        benar++;
      }
    });

    const totalSoal = questions.length;
    const nilai = Math.round((benar / totalSoal) * 100);

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

    return NextResponse.json({ 
      success: true, score: nilai, correct: benar, total: totalSoal, studentName: dbExam.users?.full_name 
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}