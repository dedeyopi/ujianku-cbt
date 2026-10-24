import type { Exam, Question, Student } from "./types";

const KUNCI_UJIAN = "ujianku_exams";
const KUNCI_LOGIN_GURU = "ujianku_teacher_logged_in";
const KUNCI_SISWA = "ujianku_students";
const KUNCI_LOGIN_SISWA = "ujianku_current_student";

const AKUN_GURU = { username: "guru", password: "guru123" };

// ---------- Migrasi soal lama ----------
function normalizeQuestion(q: Partial<Question> & { id: string }): Question {
  if (!q.type) {
    return {
      id: q.id,
      type: "multiple_choice",
      question: q.question ?? "",
      options: q.options ?? ["", "", "", ""],
      correctAnswer: q.correctAnswer ?? "",
    };
  }
  return q as Question;
}

function normalizeExam(e: Exam): Exam {
  return { ...e, questions: e.questions.map((q) => normalizeQuestion(q)) };
}

// ---------- Ujian ----------
export function getExams(): Exam[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(KUNCI_UJIAN);
  if (!data) return [];
  try {
    return (JSON.parse(data) as Exam[]).map(normalizeExam);
  } catch {
    return [];
  }
}

export function saveExam(exam: Exam) {
  const semua = getExams();
  const i = semua.findIndex((e) => e.id === exam.id);
  if (i >= 0) semua[i] = exam;
  else semua.push(exam);
  localStorage.setItem(KUNCI_UJIAN, JSON.stringify(semua));
}

export function deleteExam(id: string) {
  const semua = getExams().filter((e) => e.id !== id);
  localStorage.setItem(KUNCI_UJIAN, JSON.stringify(semua));
}

export function getExamById(id: string): Exam | null {
  return getExams().find((e) => e.id === id) || null;
}

// ---------- Login Guru ----------
export function teacherLogin(username: string, password: string): boolean {
  if (username.trim() === AKUN_GURU.username && password === AKUN_GURU.password) {
    localStorage.setItem(KUNCI_LOGIN_GURU, "true");
    return true;
  }
  return false;
}

export function isTeacherLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KUNCI_LOGIN_GURU) === "true";
}

export function teacherLogout() {
  localStorage.removeItem(KUNCI_LOGIN_GURU);
}

// ---------- Siswa (CRUD) ----------
function seedSiswaJikaKosong() {
  if (typeof window === "undefined") return;
  const data = localStorage.getItem(KUNCI_SISWA);
  if (data) return;
  const demo: Student[] = [
    {
      id: crypto.randomUUID(),
      username: "siswa",
      password: "siswa123",
      fullName: "Siswa Demo",
      className: "Kelas 9A",
      createdAt: new Date().toISOString(),
    },
  ];
  localStorage.setItem(KUNCI_SISWA, JSON.stringify(demo));
}

export function getStudents(): Student[] {
  if (typeof window === "undefined") return [];
  seedSiswaJikaKosong();
  const data = localStorage.getItem(KUNCI_SISWA);
  return data ? JSON.parse(data) : [];
}

export function saveStudent(student: Student) {
  const semua = getStudents();
  const i = semua.findIndex((s) => s.id === student.id);
  if (i >= 0) semua[i] = student;
  else semua.push(student);
  localStorage.setItem(KUNCI_SISWA, JSON.stringify(semua));
}

export function deleteStudent(id: string) {
  const semua = getStudents().filter((s) => s.id !== id);
  localStorage.setItem(KUNCI_SISWA, JSON.stringify(semua));
}

export function isUsernameTaken(username: string, exceptId?: string): boolean {
  return getStudents().some(
    (s) => s.username.toLowerCase() === username.toLowerCase() && s.id !== exceptId
  );
}

// ---------- Login Siswa ----------
export function studentLogin(username: string, password: string): Student | null {
  const found = getStudents().find(
    (s) =>
      s.username.toLowerCase() === username.trim().toLowerCase() &&
      s.password === password
  );
  if (found) {
    localStorage.setItem(KUNCI_LOGIN_SISWA, JSON.stringify(found));
    return found;
  }
  return null;
}

export function getCurrentStudent(): Student | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(KUNCI_LOGIN_SISWA);
  return data ? JSON.parse(data) : null;
}

export function studentLogout() {
  localStorage.removeItem(KUNCI_LOGIN_SISWA);
}