"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  FileText, Users, Trophy, Settings, Calendar as CalendarIcon, 
  ChevronRight, BookOpen, Clock, Plus, CheckCircle2, AlertCircle
} from "lucide-react";
import { fetchExams } from "../lib/db";
import { supabase } from "../lib/supabase";
import { isLoggedIn } from "../lib/auth";
import type { Exam } from "../lib/types";

export default function DashboardGuruPage() {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const loggedIn = await isLoggedIn();
      if (!loggedIn) { router.push("/login-guru"); return; }

      const data = await fetchExams();
      setExams(data);
      setTotalQuestions(data.reduce((sum, e) => sum + e.questions.length, 0));

      const { count } = await supabase.from("users").select("*", { count: 'exact', head: true }).eq("role", "student");
      setTotalStudents(count || 0);

      setLoading(false);
    }
    loadData();
  }, [router]);

  if (loading) {
    return <div className="flex items-center justify-center h-full"><p className="text-slate-500 animate-pulse">Memuat dashboard...</p></div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* 1. WELCOME BANNER */}
      <div className="bg-gradient-to-r from-[#3b82f6] to-[#2563eb] rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3"></div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 relative z-10">Selamat Datang, Admin! 👋</h1>
        <p className="text-blue-100 text-sm sm:text-base relative z-10 max-w-2xl">
          Sistem Computer Based Test dengan teknologi terdepan untuk pengelolaan ujian digital yang aman dan efisien.
        </p>
      </div>

      {/* 2. STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Card 1: Total Soal */}
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-5 shadow-md text-white relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-indigo-100 text-sm font-medium mb-1">Total Soal</p>
              <h3 className="text-3xl font-black">{totalQuestions}</h3>
            </div>
            <div className="p-2 bg-white/20 rounded-lg"><FileText className="w-6 h-6" /></div>
          </div>
          <div className="mt-4"><span className="text-xs bg-indigo-700/50 px-2 py-1 rounded-md">Seluruh Bank Soal</span></div>
        </div>

        {/* Card 2: Total Peserta */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 shadow-md text-white relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-emerald-100 text-sm font-medium mb-1">Total Peserta</p>
              <h3 className="text-3xl font-black">{totalStudents}</h3>
            </div>
            <div className="p-2 bg-white/20 rounded-lg"><Users className="w-6 h-6" /></div>
          </div>
          <div className="mt-4"><span className="text-xs bg-emerald-700/50 px-2 py-1 rounded-md">Siswa Terdaftar</span></div>
        </div>

        {/* Card 3: Total Ujian */}
        <div className="bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl p-5 shadow-md text-white relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-amber-100 text-sm font-medium mb-1">Total Ujian</p>
              <h3 className="text-3xl font-black">{exams.length}</h3>
            </div>
            <div className="p-2 bg-white/20 rounded-lg"><Trophy className="w-6 h-6" /></div>
          </div>
          <div className="mt-4"><span className="text-xs bg-amber-600/50 px-2 py-1 rounded-md">Ujian Dibuat</span></div>
        </div>

        {/* Card 4: Sistem */}
        <div className="bg-gradient-to-br from-sky-400 to-sky-500 rounded-2xl p-5 shadow-md text-white relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sky-100 text-sm font-medium mb-1">Versi Sistem</p>
              <h3 className="text-3xl font-black">v1.0</h3>
            </div>
            <div className="p-2 bg-white/20 rounded-lg"><Settings className="w-6 h-6" /></div>
          </div>
          <div className="mt-4"><span className="text-xs bg-sky-700/50 px-2 py-1 rounded-md">UjianKu Enterprise</span></div>
        </div>
      </div>

      {/* 3. MAIN CONTENT (TABEL & KALENDER) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Tabel Ujian (Kiri) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><CalendarIcon className="w-5 h-5 text-blue-500" /> Jadwal Ujian Terbaru</h2>
            <button onClick={() => router.push("/guru/ujian")} className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center">
              Lihat Semua <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">No</th>
                  <th className="px-6 py-4">Mata Pelajaran</th>
                  <th className="px-6 py-4">Nama Ujian</th>
                  <th className="px-6 py-4">Tanggal & Waktu</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {exams.slice(0, 5).map((exam, i) => (
                  <tr key={exam.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-bold text-slate-400">{i + 1}</td>
                    <td className="px-6 py-4 font-medium text-slate-800 flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center text-blue-600">
                        <BookOpen className="w-3.5 h-3.5" />
                      </div>
                      {exam.subject}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{exam.title}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(exam.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                      <br/>
                      <span className="text-xs text-slate-400 flex items-center gap-1 mt-1"><Clock className="w-3 h-3" /> {Math.floor(exam.duration / 60)} Menit</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {exam.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-100">
                          <AlertCircle className="w-3.5 h-3.5" /> Draft
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {exams.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">Belum ada ujian yang dibuat.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Kalender & Aksi (Kanan) */}
        <div className="space-y-6">
          
          {/* Kalender Statis (Visual) */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2"><CalendarIcon className="w-4 h-4 text-blue-500" /> Kalender</h2>
              <span className="text-xs font-medium text-slate-500">Maret 2026</span>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-400 mb-2">
              <div>Sen</div><div>Sel</div><div>Rab</div><div>Kam</div><div>Jum</div><div>Sab</div><div>Min</div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-sm text-slate-600">
              <div className="p-1.5 text-slate-300">23</div>
              <div className="p-1.5 text-slate-300">24</div>
              <div className="p-1.5 text-slate-300">25</div>
              <div className="p-1.5 text-slate-300">26</div>
              <div className="p-1.5 text-slate-300">27</div>
              <div className="p-1.5 text-slate-300">28</div>
              <div className="p-1.5 text-slate-300">29</div>
              
              <div className="p-1.5 text-slate-300">1</div>
              <div className="p-1.5 text-slate-300">2</div>
              <div className="p-1.5 text-slate-300">3</div>
              <div className="p-1.5 text-slate-300">4</div>
              <div className="p-1.5 text-slate-300">5</div>
              <div className="p-1.5 text-slate-300">6</div>
              <div className="p-1.5 text-slate-300">7</div>

              <div className="p-1.5">8</div>
              <div className="p-1.5">9</div>
              <div className="p-1.5">10</div>
              <div className="p-1.5">11</div>
              <div className="p-1.5">12</div>
              <div className="p-1.5">13</div>
              <div className="p-1.5">14</div>

              <div className="p-1.5">15</div>
              <div className="p-1.5 bg-blue-600 text-white rounded-md shadow-sm">16</div>
              <div className="p-1.5">17</div>
              <div className="p-1.5">18</div>
              <div className="p-1.5">19</div>
              <div className="p-1.5">20</div>
              <div className="p-1.5">21</div>

              <div className="p-1.5">22</div>
              <div className="p-1.5">23</div>
              <div className="p-1.5">24</div>
              <div className="p-1.5">25</div>
              <div className="p-1.5">26</div>
              <div className="p-1.5">27</div>
              <div className="p-1.5">28</div>
            </div>
          </div>

          {/* Aksi Cepat */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">⚡ Aksi Cepat</h2>
            <button onClick={() => router.push("/guru/ujian/baru")} className="w-full py-3 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 border border-blue-100">
              <Plus className="w-4 h-4" /> Buat Ujian Baru
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}