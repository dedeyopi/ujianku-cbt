"use client";

import { useState } from "react";
import { School } from "lucide-react";

export function Logo({ className = "w-9 h-9" }: { className?: string }) {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    // Fallback jika logo.png belum di-upload
    return <School className={`${className} text-emerald-600`} />;
  }

  return (
    <img 
      src="/logo.png" 
      alt="Logo Sekolah" 
      className={`${className} object-contain`} 
      onError={() => setImgError(true)}
    />
  );
}