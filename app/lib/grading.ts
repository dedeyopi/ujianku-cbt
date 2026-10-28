import type { Question } from "./types";

export function isJawabanBenar(q: Question, jawabanSiswa: any): boolean {
  if (jawabanSiswa === undefined || jawabanSiswa === null) return false;
  
  // Fungsi untuk menghapus semua tag HTML (seperti <div>, <p>, <span>) agar teksnya bersih
  const stripHtml = (html: any) => String(html).replace(/<[^>]*>?/gm, '');
  
  // Fungsi normalisasi: hapus HTML, hapus spasi di ujung, ubah ke huruf kecil
  const normalize = (s: any) => stripHtml(s).trim().toLowerCase();

  switch (q.type) {
    case "multiple_choice": 
      return normalize(jawabanSiswa) === normalize(q.correctAnswer);
    case "complex_mc":
      if (!Array.isArray(jawabanSiswa) || !q.correctAnswers) return false;
      if (jawabanSiswa.length !== q.correctAnswers.length) return false;
      return jawabanSiswa.every(ans => q.correctAnswers!.some(c => normalize(c) === normalize(ans)));
    case "true_false": 
      return jawabanSiswa === q.trueFalseAnswer;
    case "multi_true_false":
      if (!q.statements) return false;
      return q.statements.every((st, i) => jawabanSiswa[i] === st.isTrue);
    case "matching":
      if (!q.pairs || !jawabanSiswa) return false;
      return q.pairs.every(p => jawabanSiswa[p.left] === p.right);
    case "ordering":
      if (!q.items || !Array.isArray(jawabanSiswa)) return false;
      return q.items.every((item, i) => jawabanSiswa[i] === item);
    case "short_answer":
      const accepted = q.acceptedAnswers || [];
      return accepted.some((a) => normalize(a) === normalize(jawabanSiswa));
    default: 
      return false;
  }
}