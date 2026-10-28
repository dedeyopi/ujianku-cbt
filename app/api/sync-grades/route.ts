import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../lib/supabaseAdmin";
import { isJawabanBenar } from "../../lib/grading";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { examId } = body;

    if (!examId) return NextResponse.json({ error: "Exam ID required" }, { status: 400 });

    // 1. Ambil kunci jawaban terbaru
    const { data: dbExam, error: examError } = await supabaseAdmin
      .from("exams")
      .select("*, questions(*)")
      .eq("id", examId)
      .single();

    if (examError || !dbExam) return NextResponse.json({ error: "Ujian tidak ditemukan" }, { status: 404 });

    const questions = dbExam.questions.sort((a: any, b: any) => a.order_index - b.order_index);
    const totalSoal = questions.length;

    // 2. Ambil semua hasil siswa untuk ujian ini
    const { data: results, error: resultError } = await supabaseAdmin
      .from("results")
      .select("*")
      .eq("exam_id", examId);

    if (resultError || !results) return NextResponse.json({ error: "Gagal mengambil hasil" }, { status: 500 });

    let updatedCount = 0;

    // 3. Hitung ulang setiap siswa
    for (const res of results) {
      let correctAuto = 0;
      
      questions.forEach((dbQ: any) => {
        // Gabungkan data dasar soal dengan kunci jawaban dari database
        const q = { 
          id: dbQ.id, 
          type: dbQ.type, 
          question: dbQ.question, 
          ...(dbQ.correct_answer || {}) 
        };
        
        if (res.answers && isJawabanBenar(q as any, res.answers[dbQ.id])) {
          correctAuto++;
        }
      });

      // Tambahkan nilai esai manual jika ada
      let essayContribution = 0;
      if (res.manual_grades) {
        Object.values(res.manual_grades).forEach((score: any) => {
          essayContribution += (Number(score) / 100);
        });
      }

      const totalPoin = correctAuto + essayContribution;
      const nilaiBaru = Math.round((totalPoin / totalSoal) * 100);

      // Update database jika nilainya berbeda
      if (nilaiBaru !== res.score) {
        await supabaseAdmin
          .from("results")
          .update({ score: nilaiBaru, correct: correctAuto })
          .eq("id", res.id);
        updatedCount++;
      }
    }

    return NextResponse.json({ success: true, updatedCount, totalResults: results.length });

  } catch (err: any) {
    console.error("Sync Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}