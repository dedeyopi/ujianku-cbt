import type { Question } from "./types";

export function isJawabanBenar(q: Question, jawabanSiswa: any): boolean {
  if (jawabanSiswa === undefined || jawabanSiswa === null) return false;
  const normalize = (s: string) => String(s).trim().toLowerCase();
  
  // Data kunci jawaban biasanya ada di properti correct_answer di DB
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