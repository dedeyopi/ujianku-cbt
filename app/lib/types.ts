export type QuestionType =
  | "multiple_choice"
  | "complex_mc"
  | "true_false"
  | "multi_true_false"
  | "matching"
  | "ordering"
  | "short_answer"
  | "essay";

export type Question = {
  id: string;
  type: QuestionType;
  question: string;
  image?: string;
  
  // PG Tunggal & Kompleks
  options?: string[];
  optionImages?: (string | undefined)[]; // BARU: Gambar untuk tiap opsi
  correctAnswer?: string;
  correctAnswers?: string[];
  
  // B/S Tunggal
  trueFalseAnswer?: boolean;
  
  // B/S Bertingkat
  statements?: { text: string; isTrue: boolean }[];
  
  // Menjodohkan
  pairs?: { left: string; right: string }[];
  
  // Mengurutkan
  items?: string[]; 
  
  // Isian Singkat
  acceptedAnswers?: string[];
  
  // Esai
  minWords?: number;
  examId?: string | null;
  ownerId?: string;
  subject?: string;
  topic?: string;
};

export type Exam = {
  id: string;
  title: string;
  subject: string;
  duration: number;
  questions: Question[];
  createdAt: string;
  isActive: boolean;
  token?: string;        // <-- TAMBAHKAN INI
  startTime?: string;    // <-- TAMBAHKAN INI
  endTime?: string;      // <-- TAMBAHKAN INI
};

export type ExamSession = {
  examId: string;
  studentId: string;
  studentName: string;
  answers: Record<string, any>;
  startedAt: string;
  violations: number;
  lastUpdated: string;
};

export type Student = {
  id: string;
  username: string;
  password: string;
  fullName: string;
  className: string;
  createdAt: string;
};

export type ExamResult = {
  id: string;
  examId: string;
  examTitle: string;
  studentId: string;
  studentName: string;
  className: string;
  score: number;
  correct: number;
  total: number;
  violations: number;
  submittedAt: string;
  answers?: Record<string, any>;
  manualGrades?: Record<string, number>;
};

export type ActiveSession = {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  className: string;
  currentQuestion: number;
  totalQuestions: number;
  violations: number;
  lastSeen: string;
  startedAt: string; // <-- TAMBAHKAN INI
  tabId: string;     // <-- TAMBAHKAN INI
};

export type AppSettings = {
  schoolName: string;
  schoolLogoUrl: string | null;
};