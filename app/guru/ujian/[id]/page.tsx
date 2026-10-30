import { EditExamClient } from "./EditExamClient";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  // Menunggu params dari Next.js (Standar Next.js 15/16)
  const { id } = await params;
  
  // Melewatkan ID langsung ke komponen client
  return <EditExamClient examId={id} />;
}