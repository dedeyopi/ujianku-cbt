"use client";

import { useState } from "react";
import { X, Upload, AlertCircle } from "lucide-react";
import { compressImage } from "../lib/image";
import { supabase } from "../lib/supabase";

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
      // 1. Kompres gambar terlebih dahulu
      const base64 = await compressImage(file, 800, 0.75);
      
      // 2. Ubah base64 menjadi Blob untuk di-upload
      const res = await fetch(base64);
      const blob = await res.blob();
      
      // 3. Buat nama file unik
      const fileName = `${crypto.randomUUID()}.jpg`;
      
      // 4. Upload ke Supabase Storage (bucket: exam-images)
      const { error: uploadError } = await supabase.storage
        .from("exam-images")
        .upload(fileName, blob, { contentType: "image/jpeg" });

      if (uploadError) throw uploadError;

      // 5. Ambil URL publik gambar
      const { data: { publicUrl } } = supabase.storage
        .from("exam-images")
        .getPublicUrl(fileName);

      onChange(publicUrl); // Kembalikan URL, bukan base64
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Gagal mengunggah gambar ke server.");
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
        {loading ? "Mengunggah ke server..." : "Upload Gambar (Opsional)"}
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
        Format JPG/PNG. Gambar akan disimpan di server aman.
      </p>
    </div>
  );
}