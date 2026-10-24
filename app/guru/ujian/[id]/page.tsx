import { Suspense } from "react";
import { EditExamClient } from "./EditExamClient";

export const instant = false;

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
          <p className="text-sm text-slate-500">Memuat editor...</p>
        </div>
      }
    >
      <EditExamClient />
    </Suspense>
  );
}