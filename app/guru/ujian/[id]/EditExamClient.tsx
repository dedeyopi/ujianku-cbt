"use client";

import { useParams } from "next/navigation";
import { ExamEditor } from "../../../components/ExamEditor";

export function EditExamClient() {
  const params = useParams<{ id: string }>();
  return <ExamEditor examId={params.id} />;
}