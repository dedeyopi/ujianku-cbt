"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Users,
  X,
  Save,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Input } from "../../components/Input";
import {
  isTeacherLoggedIn,
  getStudents,
  saveStudent,
  deleteStudent,
  isUsernameTaken,
} from "../../lib/storage";
import type { Student } from "../../lib/types";

export default function KelolaSiswaPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    id: "",
    username: "",
    password: "",
    fullName: "",
    className: "",
  });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isTeacherLoggedIn()) {
      router.push("/guru/login");
      return;
    }
    setStudents(getStudents());
    setLoading(false);
  }, [router]);

  function resetForm() {
    setForm({ id: "", username: "", password: "", fullName: "", className: "" });
    setError("");
    setShowForm(false);
  }

  function openEdit(s: Student) {
    setForm({
      id: s.id,
      username: s.username,
      password: s.password,
      fullName: s.fullName,
      className: s.className,
    });
    setShowForm(true);
    setError("");
  }

  function handleSave() {
    setError("");
    if (!form.username.trim() || !form.password || !form.fullName.trim()) {
      setError("Username, kata sandi, dan nama lengkap wajib diisi.");
      return;
    }
    if (isUsernameTaken(form.username, form.id || undefined)) {
      setError("Username sudah dipakai siswa lain.");
      return;
    }

    const student: Student = {
      id: form.id || crypto.randomUUID(),
      username: form.username.trim(),
      password: form.password,
      fullName: form.fullName.trim(),
      className: form.className.trim(),
      createdAt: new Date().toISOString(),
    };
    saveStudent(student);
    setStudents(getStudents());
    resetForm();
  }

  function handleDelete(s: Student) {
    if (!confirm(`Hapus akun siswa "${s.fullName}"?`)) return;
    deleteStudent(s.id);
    setStudents(getStudents());
  }

  if (loading) return null;

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.push("/guru")}>
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Kembali
          </Button>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-slate-900 text-sm">
              Kelola Siswa
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Daftar Siswa ({students.length})
            </h2>
            <p className="text-sm text-slate-500">
              Buat akun untuk siswa sebelum mereka mengikuti ujian
            </p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] px-5 py-2.5 text-sm bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Tambah Siswa
            </button>
          )}
        </div>

        {showForm && (
          <Card className="p-5 mb-5 border-emerald-200 ring-1 ring-emerald-500/20 animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">
                {form.id ? "Edit Siswa" : "Siswa Baru"}
              </h3>
              <button
                onClick={resetForm}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <Input
                id="username"
                label="Username"
                placeholder="Contoh: budi.santoso"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
              <Input
                id="password"
                label="Kata Sandi"
                type="text"
                placeholder="Kata sandi awal"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  id="fullName"
                  label="Nama Lengkap"
                  placeholder="Contoh: Budi Santoso"
                  value={form.fullName}
                  onChange={(e) =>
                    setForm({ ...form, fullName: e.target.value })
                  }
                />
                <Input
                  id="className"
                  label="Kelas"
                  placeholder="Contoh: 9A"
                  value={form.className}
                  onChange={(e) =>
                    setForm({ ...form, className: e.target.value })
                  }
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={resetForm}
                >
                  Batal
                </Button>
                <button
                  onClick={handleSave}
                  className="flex-1 inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] px-5 py-2.5 text-sm bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20"
                >
                  <Save className="w-4 h-4 mr-1.5" />
                  {form.id ? "Simpan Perubahan" : "Tambah Siswa"}
                </button>
              </div>
            </div>
          </Card>
        )}

        {students.length === 0 && !showForm && (
          <Card className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 mb-4">
              <Users className="w-7 h-7 text-emerald-400" />
            </div>
            <p className="text-sm text-slate-500">
              Belum ada siswa. Klik &quot;Tambah Siswa&quot; untuk memulai.
            </p>
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
                  <p className="font-semibold text-slate-900 truncate">
                    {s.fullName}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 text-xs text-slate-500 mt-0.5">
                    <span>
                      @{s.username}{" "}
                      <button
                        onClick={() =>
                          setShowPassword((p) => ({ ...p, [s.id]: !p[s.id] }))
                        }
                        className="inline-flex items-center text-slate-400 hover:text-slate-700 ml-1"
                      >
                        {showPassword[s.id] ? (
                          <EyeOff className="w-3 h-3" />
                        ) : (
                          <Eye className="w-3 h-3" />
                        )}
                      </button>
                    </span>
                    {showPassword[s.id] && (
                      <span className="font-mono text-slate-600">
                        {s.password}
                      </span>
                    )}
                    {s.className && <span>• {s.className}</span>}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openEdit(s)}
                    className="hover:border-emerald-300 hover:text-emerald-700"
                  >
                    Edit
                  </Button>
                  <button
                    onClick={() => handleDelete(s)}
                    className="p-2 rounded-lg hover:bg-red-50 text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}