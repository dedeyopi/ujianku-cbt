"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Users, X, Save, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Input } from "../../components/Input";
import { isLoggedIn, createStudentAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import type { Student } from "../../lib/types";

export default function KelolaSiswaPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ username: "", password: "", fullName: "", className: "" });
  const [error, setError] = useState("");

  async function fetchStudents() {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("role", "student")
      .order("full_name");
      
    if (!error && data) {
      setStudents(data.map((s: any) => ({
        id: s.id, username: s.username, password: "********", // Sembunyikan password asli
        fullName: s.full_name, className: s.class_name, createdAt: s.created_at
      })));
    }
    setLoading(false);
  }

  useEffect(() => {
    async function init() {
      const loggedIn = await isLoggedIn();
      if (!loggedIn) { router.push("/guru/login"); return; }
      await fetchStudents();
    }
    init();
  }, [router]);

  function resetForm() {
    setForm({ username: "", password: "", fullName: "", className: "" });
    setError("");
    setShowForm(false);
  }

  async function handleSave() {
    setError("");
    if (!form.username.trim() || !form.password || !form.fullName.trim()) {
      setError("Username, kata sandi, dan nama lengkap wajib diisi.");
      return;
    }

    setIsSaving(true);
    const res = await createStudentAuth(form.username, form.password, form.fullName, form.className);
    
    if (res.success) {
      // Perbarui profil di public.users (karena trigger mungkin belum menyertakan class_name)
      if (res.user) {
         await supabase.from("users").update({
           full_name: form.fullName,
           class_name: form.className
         }).eq("id", res.user.id);
      }
      
      await fetchStudents();
      resetForm();
    } else {
      setError(res.message || "Gagal membuat akun siswa.");
    }
    setIsSaving(false);
  }

  async function handleDelete(s: Student) {
    if (!confirm(`Hapus akun siswa "${s.fullName}"?`)) return;
    
    // Hapus dari tabel public.users (Auth user tidak bisa dihapus dari client-side tanpa service key)
    await supabase.from("users").delete().eq("id", s.id);
    await fetchStudents();
  }

  if (loading) return null;

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.push("/guru")}>
            <ArrowLeft className="w-4 h-4 mr-1.5" />Kembali
          </Button>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-slate-900 text-sm">Kelola Siswa</span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Daftar Siswa ({students.length})</h2>
            <p className="text-sm text-slate-500">Data tersimpan aman di Supabase Cloud</p>
          </div>
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="inline-flex items-center justify-center font-semibold rounded-xl px-5 py-2.5 text-sm bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm">
              <Plus className="w-4 h-4 mr-1.5" />Tambah Siswa
            </button>
          )}
        </div>

        {showForm && (
          <Card className="p-5 mb-5 border-emerald-200 ring-1 ring-emerald-500/20 animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Siswa Baru</h3>
              <button onClick={resetForm} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input id="username" label="Username (untuk login)" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
                <Input id="password" label="Kata Sandi Awal" type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                <Input id="fullName" label="Nama Lengkap" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
                <Input id="className" label="Kelas (Opsional)" value={form.className} onChange={(e) => setForm({ ...form, className: e.target.value })} />
              </div>

              {error && <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2"><AlertCircle className="w-4 h-4" />{error}</div>}

              <div className="flex gap-2 pt-2">
                <Button variant="secondary" className="flex-1" onClick={resetForm}>Batal</Button>
                <button onClick={handleSave} disabled={isSaving} className="flex-1 inline-flex items-center justify-center font-semibold rounded-xl px-5 py-2.5 text-sm bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm disabled:opacity-50">
                  <Save className="w-4 h-4 mr-1.5" />{isSaving ? "Menyimpan..." : "Tambah Siswa"}
                </button>
              </div>
            </div>
          </Card>
        )}

        <div className="space-y-2">
          {students.map((s) => (
            <Card key={s.id} className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0">
                  {s.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{s.fullName}</p>
                  <div className="flex flex-wrap items-center gap-x-3 text-xs text-slate-500 mt-0.5">
                    <span>@{s.username}</span>
                    {s.className && <span>• {s.className}</span>}
                  </div>
                </div>
                <button onClick={() => handleDelete(s)} className="p-2 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}