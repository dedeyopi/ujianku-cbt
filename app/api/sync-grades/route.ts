import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../lib/supabaseAdmin";
import { hitungPoinSoal } from "../../lib/grading";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { examId } = body;

    if (!examId) return NextResponse.json({ error: "Exam ID required" }, { status: 400 });

    const { data: dbExam, error: examError } = await supabaseAdmin
      .from("exams")
      .select("*, questions(*)")
      .eq("id", examId)
      .single();

    if (examError || !dbExam) return NextResponse.json({ error: "Ujian tidak ditemukan" }, { status: 404 });

    const questions = dbExam.questions.sort((a: any, b: any) => a.order_index - b.order_index);
    const totalSoal = questions.length;

    const { data: results, error: resultError } = await supabaseAdmin
      .from("results")
      .select("*")
      .eq("exam_id", examId);

    if (resultError || !results) return NextResponse.json({ error: "Gagal mengambil hasil" }, { status: 500 });

    let updatedCount = 0;

    for (const res of results) {
      let totalPoinOto = 0;
      
      let studentAnswers = res.answers || {};
      if (typeof studentAnswers === 'string') {
        try { studentAnswers = JSON.parse(studentAnswers); } catch(e) { studentAnswers = {}; }
      }

      questions.forEach((dbQ: any) => {
        let correctAns = dbQ.correct_answer || {};
        if (typeof correctAns === 'string') {
          try { correctAns = JSON.parse(correctAns); } catch(e) { correctAns = {}; }
        }
        
        const q = { id: dbQ.id, type: dbQ.type, question: dbQ.question, ...correctAns };
        
        if (studentAnswers && studentAnswers[dbQ.id]) {
          totalPoinOto += hitungPoinSoal(q as any, studentAnswers[dbQ.id]);
        }
      });

      let essayContribution = 0;
      if (res.manual_grades) {
        let mg = res.manual_grades;
        if (typeof mg === 'string') {
          try { mg = JSON.parse(mg); } catch(e) { mg = {}; }
        }
        Object.values(mg).forEach((score: any) => {
          essayContribution += (Number(score) / 100);
        });
      }

      const totalPoin = totalPoinOto + essayContribution;
      const nilaiBaru = Math.round((totalPoin / totalSoal) * 100);
      const correctRounded = Math.round(totalPoin * 100) / 100;

      await supabaseAdmin
        .from("results")
        .update({ score: nilaiBaru, correct: correctRounded })
        .eq("id", res.id);
      updatedCount++;
    }

    return NextResponse.json({ success: true, updatedCount, totalResults: results.length });

  } catch (err: any) {
    console.error("Sync Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}