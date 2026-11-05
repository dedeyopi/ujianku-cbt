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
  optionImages?: (string | undefined)[];
  _optIdx?: number[]; // <-- TAMBAHKAN INI UNTUK MELACAK URUTAN ASLI SAAT DIACAK
  correctAnswer?: string;
  correctAnswers?: string[];
  
  // B/S Tunggal
  trueFalseAnswer?: boolean;
  
  // B/S Bertingkat
  statements?: { text: string; isTrue: boolean }[];
  
  // Menjodohkan (Ditambah Gambar)
  pairs?: { 
    left: string; 
    right: string; 
    leftImage?: string; 
    rightImage?: string; 
  }[];
  
  // Mengurutkan
  items?: string[];
  
  // Isian Singkat
  acceptedAnswers?: string[];
  
  // Esai
  minWords?: number;

  // Bank Soal (Opsional)
  examId?: string | null;
  ownerId?: string;
  subject?: string;
  topic?: string;
};

export type Exam = {
  id: string;
  title: string;
  subject: string;
  duration: number; // dalam detik
  questions: Question[];
  createdAt: string;
  isActive: boolean;
  token?: string;
  startTime?: string;
  endTime?: string;
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
  startedAt: string;
  tabId: string;
};

export type AppSettings = {
  schoolName: string;
  schoolLogoUrl: string | null;
};
