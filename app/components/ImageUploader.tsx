"use client";

import { useState } from "react";
import { X, Upload, AlertCircle } from "lucide-react";
import { compressImage, estimateSize } from "../lib/image";

type Props = {
  value?: string;
  onChange: (image: string | undefined) => void;
};

export function ImageUploader({ value, onChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("File harus berupa gambar (JPG, PNG, dll).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran file maksimal 5 MB.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const compressed = await compressImage(file, 800, 0.75);
      onChange(compressed);
    } catch {
      setError("Gagal memproses gambar.");
    }
    setLoading(false);
  }

  if (value) {
    return (
      <div className="inline-block">
        <div className="relative inline-block">
          <img
            src={value}
            alt="Gambar soal"
            className="max-h-48 rounded-xl border border-slate-200 bg-white"
          />
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition"
            title="Hapus gambar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-1.5">
          Ukuran: {estimateSize(value)}
        </p>
      </div>
    );
  }

  return (
    <div>
      <label
        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-slate-300 cursor-pointer transition text-sm text-slate-600 ${
          loading
            ? "opacity-60 cursor-wait"
            : "hover:border-emerald-500 hover:bg-emerald-50"
        }`}
      >
        <Upload className="w-4 h-4" />
        {loading ? "Memproses gambar..." : "Upload Gambar (Opsional)"}
        <input
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
          disabled={loading}
        />
      </label>

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 mt-2">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </div>
      )}

      <p className="text-xs text-slate-400 mt-1.5">
        Otomatis dikompresi ke maks 800px. Format JPG/PNG.
      </p>
    </div>
  );
}