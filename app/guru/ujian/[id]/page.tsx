import { Suspense } from "react";
import { EditExamClient } from "./EditExamClient";

export const instant = false;

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <p className="text-sm text-slate-500 animate-pulse">Memuat editor ujian...</p>
        </div>
      }
    >
      <EditExamClient />
    </Suspense>
  );
}