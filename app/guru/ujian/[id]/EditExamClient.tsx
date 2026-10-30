"use client";

import { ExamEditor } from "../../../components/ExamEditor";

export function EditExamClient({ examId }: { examId: string }) {
  return <ExamEditor examId={examId} />;
}