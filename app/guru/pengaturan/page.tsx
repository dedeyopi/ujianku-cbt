"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Building2, Upload, Save, CheckCircle2, AlertCircle, Image as ImageIcon, X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { isLoggedIn } from "../../lib/auth";
import { fetchAppSettings, updateAppSettings } from "../../lib/db";

export default function PengaturanPage() {
  const router = useRouter();
  const [schoolName, setSchoolName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadData() {
      const loggedIn = await isLoggedIn();
      if (!loggedIn) { router.push("/login-guru"); return; }

      const settings = await fetchAppSettings();
      setSchoolName(settings.schoolName);
      setLogoUrl(settings.schoolLogoUrl);
      setLoading(false);
    }
    loadData();
  }, [router]);

  async function handleUploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: "error", text: "Ukuran logo maksimal 2 MB." });
      return;
    }

    setUploading(true);
    setMessage({ type: "", text: "" });

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("school-assets")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("school-assets")
        .getPublicUrl(fileName);

      setLogoUrl(publicUrl);
      setMessage({ type: "success", text: "Logo berhasil diunggah. Jangan lupa klik Simpan." });
    } catch (error: any) {
      setMessage({ type: "error", text: "Gagal mengunggah logo: " + error.message });
    }
    setUploading(false);
  }

  async function handleSave() {
    setSaving(true);
    setMessage({ type: "", text: "" });
    
    const success = await updateAppSettings(schoolName, logoUrl);
    
    if (success) {
      setMessage({ type: "success", text: "Pengaturan berhasil disimpan!" });
    } else {
      setMessage({ type: "error", text: "Gagal menyimpan pengaturan." });
    }
    setSaving(false);
  }

  if (loading) return <div className="p-8 text-center text-slate-500">Memuat pengaturan...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-800 mb-1 flex items-center gap-2">
          <Building2 className="w-6 h-6 text-blue-600" /> Identitas Sekolah
        </h1>
        <p className="text-slate-500 text-sm mb-8">Ubah nama dan logo sekolah yang akan tampil di seluruh aplikasi.</p>

        <div className="space-y-6">
          
          {/* Nama Sekolah */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Nama Sekolah / Instansi</label>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="Contoh: SMAN 1 Jakarta"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition text-base"
            />
          </div>

          {/* Logo Sekolah */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Logo Sekolah</label>
            <div className="flex items-start gap-6">
              <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center overflow-hidden relative shrink-0">
                {logoUrl ? (
                  <>
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                    <button onClick={() => setLogoUrl(null)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 shadow-sm">
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
                    <span className="text-xs text-slate-500 text-center px-2">Belum ada logo</span>
                  </>
                )}
              </div>
              <div className="flex-1">
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={uploading}
                  className="inline-flex items-center justify-center font-semibold rounded-xl px-4 py-2.5 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 transition disabled:opacity-50 border border-blue-100"
                >
                  <Upload className="w-4 h-4 mr-2" /> {uploading ? "Mengunggah..." : "Pilih File Logo"}
                </button>
                <input type="file" accept="image/png, image/jpeg, image/svg+xml" className="hidden" ref={fileInputRef} onChange={handleUploadLogo} />
                <p className="text-xs text-slate-500 mt-2">Format: PNG, JPG, atau SVG. Maksimal 2 MB. <br/> Disarankan gambar dengan latar transparan (PNG).</p>
              </div>
            </div>
          </div>

          {message.text && (
            <div className={`p-4 rounded-xl flex items-start gap-3 text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
              {message.text}
            </div>
          )}

          <div className="pt-4 border-t border-slate-100">
            <button 
              onClick={handleSave} 
              disabled={saving || uploading}
              className="inline-flex items-center justify-center font-bold rounded-xl px-6 py-3 text-sm bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" /> {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}