import type { ExamSession } from "./types";

const KEY = (examId: string) => `ujianku_session_${examId}`;

export function getSession(examId: string): ExamSession | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(KEY(examId));
  return data ? JSON.parse(data) : null;
}

export function saveSession(session: ExamSession) {
  localStorage.setItem(KEY(session.examId), JSON.stringify(session));
}

export function clearSession(examId: string) {
  localStorage.removeItem(KEY(examId));
}