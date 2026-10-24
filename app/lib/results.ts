import type { ExamResult } from "./types";

const KUNCI_HASIL = "ujianku_results";

export function getResults(): ExamResult[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(KUNCI_HASIL);
  return data ? JSON.parse(data) : [];
}

export function saveResult(result: ExamResult) {
  const semua = getResults();
  // Cek apakah siswa sudah pernah mengerjakan ujian ini
  const existingIndex = semua.findIndex(
    (r) => r.examId === result.examId && r.studentId === result.studentId
  );

  if (existingIndex >= 0) {
    // Timpa hasil sebelumnya (jika mengulang)
    semua[existingIndex] = result;
  } else {
    semua.push(result);
  }
  localStorage.setItem(KUNCI_HASIL, JSON.stringify(semua));
}

export function getResultsByExam(examId: string): ExamResult[] {
  return getResults().filter((r) => r.examId === examId);
}

export function deleteResultsByExam(examId: string) {
  const semua = getResults().filter((r) => r.examId !== examId);
  localStorage.setItem(KUNCI_HASIL, JSON.stringify(semua));
}