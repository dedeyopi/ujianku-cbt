"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Award, AlertTriangle, TrendingUp, RotateCcw } from "lucide-react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";

type Hasil = {
  nama: string;
  examTitle?: string;
  benar: number;
  total: number;
  nilai: number;
  violations?: number;
};

function getKategori(nilai: number) {
  if (nilai >= 90)
    return {
      label: "Luar Biasa",
      warna: "text-emerald-600",
      bg: "from-emerald-50 to-teal-50",
      ring: "text-emerald-500",
      pesan: "Pemahaman Anda sangat baik. Pertahankan!",
    };
  if (nilai >= 75)
    return {
      label: "Bagus",
      warna: "text-blue-600",
      bg: "from-blue-50 to-indigo-50",
      ring: "text-blue-500",
      pesan: "Hasil yang baik. Sedikit lagi menuju sempurna.",
    };
  if (nilai >= 60)
    return {
      label: "Cukup",
      warna: "text-amber-600",
      bg: "from-amber-50 to-orange-50",
      ring: "text-amber-500",
      pesan: "Pelajari kembali materi yang masih sulit.",
    };
  return {
    label: "Perlu Belajar Lagi",
    warna: "text-red-600",
    bg: "from-red-50 to-rose-50",
    ring: "text-red-500",
    pesan: "Jangan menyerah. Ujian berikutnya pasti lebih baik.",
  };
}

export default function HasilPage() {
  const router = useRouter();
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [animasiNilai, setAnimasiNilai] = useState(0);

  useEffect(() => {
    const data = localStorage.getItem("hasilUjian");
    if (!data) {
      router.push("/");
      return;
    }
    const parsed = JSON.parse(data);
    setHasil(parsed);

    // Animasi nilai naik dari 0 ke nilai akhir
    const target = parsed.nilai;
    const duration = 800;
    const step = Math.max(1, Math.ceil(target / 30));
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      setAnimasiNilai(current);
    }, duration / 30);

    return () => clearInterval(timer);
  }, [router]);

  if (!hasil) return null;

  const kategori = getKategori(hasil.nilai);
  const persen = hasil.nilai;

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="w-full max-w-md animate-fade-in-up">
        <Card className="p-8 text-center">
          <div
            className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${kategori.bg} bg-gradient-to-br`}
          >
            <Award className={`w-8 h-8 ${kategori.warna}`} />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            Ujian Selesai
          </h1>
          <p className="text-sm text-slate-500 mb-1">
            Terima kasih,{" "}
            <span className="font-medium text-slate-700">{hasil.nama}</span>
          </p>
          {hasil.examTitle && (
            <p className="text-xs text-slate-400 mb-6">{hasil.examTitle}</p>
          )}

          {/* Lingkaran nilai */}
          <div className="relative inline-flex items-center justify-center mb-4">
            <svg className="w-40 h-40 -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="currentColor"
                className={kategori.ring}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(persen / 100) * 264} 264`}
                style={{ transition: "stroke-dasharray 1s ease-out" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className={`text-5xl font-extrabold tracking-tight tabular-nums ${kategori.warna}`}
              >
                {animasiNilai}
              </span>
              <span className="text-xs text-slate-400 mt-1">dari 100</span>
            </div>
          </div>

          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 mb-3`}>
            <TrendingUp className={`w-3.5 h-3.5 ${kategori.warna}`} />
            <span className={`text-xs font-semibold ${kategori.warna}`}>
              {kategori.label}
            </span>
          </div>

          <p className="text-sm text-slate-500 mb-5">{kategori.pesan}</p>

          <div className="bg-slate-50 rounded-xl p-4 mb-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Jawaban Benar</span>
              <span className="font-bold text-slate-900">
                {hasil.benar} / {hasil.total}
              </span>
            </div>
          </div>

          {hasil.violations !== undefined && hasil.violations > 0 && (
            <div className="flex items-start gap-2 text-left bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-900">
                  Tercatat {hasil.violations}x pelanggaran
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Guru akan menerima laporan ini.
                </p>
              </div>
            </div>
          )}

          <Button
            onClick={() => {
              localStorage.removeItem("hasilUjian");
              localStorage.removeItem("namaSiswa");
              router.push("/");
            }}
            className="w-full"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Selesai
          </Button>
        </Card>

        <p className="text-center text-xs text-slate-400 mt-4">
          Screenshot halaman ini sebagai bukti ujian Anda
        </p>
      </div>
    </main>
  );
}