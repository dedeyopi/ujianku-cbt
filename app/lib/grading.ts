import type { Question } from "./types";

// Fungsi untuk cek benar/salah total (dipakai di Analisis Butir Soal)
export function isJawabanBenar(q: Question, jawabanSiswa: any): boolean {
  return hitungPoinSoal(q, jawabanSiswa) === 1;
}

// Fungsi BARU: Menghitung poin parsial (0.0 s/d 1.0)
export function hitungPoinSoal(q: Question, jawabanSiswa: any): number {
  if (jawabanSiswa === undefined || jawabanSiswa === null) return 0;
  
  const stripHtml = (html: any) => String(html).replace(/<[^>]*>?/gm, '');
  const normalize = (s: any) => stripHtml(s).trim().toLowerCase();

  switch (q.type) {
    case "multiple_choice": 
      return normalize(jawabanSiswa) === normalize(q.correctAnswer) ? 1 : 0;
      
    case "complex_mc":
      if (!Array.isArray(jawabanSiswa) || !q.correctAnswers || q.correctAnswers.length === 0) return 0;
      const benarMc = jawabanSiswa.filter(ans => q.correctAnswers!.some(c => normalize(c) === normalize(ans))).length;
      // Nilai parsial: (jumlah benar / total kunci)
      return Math.min(1, benarMc / q.correctAnswers.length);
      
    case "true_false": 
      return jawabanSiswa === q.trueFalseAnswer ? 1 : 0;
      
    case "multi_true_false":
      if (!q.statements || q.statements.length === 0) return 0;
      const benarSt = q.statements.filter((st, i) => jawabanSiswa[i] === st.isTrue).length;
      return benarSt / q.statements.length;
      
    case "matching":
      if (!q.pairs || q.pairs.length === 0) return 0;
      const benarPair = q.pairs.filter(p => jawabanSiswa[p.left] === p.right).length;
      return benarPair / q.pairs.length;
      
    case "ordering":
      if (!q.items || !Array.isArray(jawabanSiswa) || q.items.length === 0) return 0;
      const benarOrder = q.items.filter((item, i) => jawabanSiswa[i] === item).length;
      return benarOrder / q.items.length;
      
    case "short_answer":
      const accepted = q.acceptedAnswers || [];
      return accepted.some((a) => normalize(a) === normalize(jawabanSiswa)) ? 1 : 0;
      
    case "essay": 
      return 0; // Esai dinilai manual oleh guru
      
    default: 
      return 0;
  }
}