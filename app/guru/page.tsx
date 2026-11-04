"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  FileText, Users, Trophy, Settings, Calendar as CalendarIcon, 
  ChevronRight, BookOpen, Clock, Plus, CheckCircle2, AlertCircle, ChevronLeft
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

  // State Kalender
  const [currentDate, setCurrentDate] = useState(new Date());

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

  // --- LOGIKA KALENDER ---
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0 (Minggu) - 6 (Sabtu)
  
  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const dayNames = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  // Cek apakah ada ujian di tanggal tertentu
  const hasExamOnDate = (day: number) => {
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return exams.some(e => {
      const examDate = new Date(e.createdAt);
      return examDate.getDate() === targetDate.getDate() && examDate.getMonth() === targetDate.getMonth() && examDate.getFullYear() === targetDate.getFullYear();
    });
  };

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

      {/* 2. STAT CARDS (INTERAKTIF) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        <Link href="/guru/bank-soal" className="block group">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-5 shadow-md text-white relative overflow-hidden group-hover:scale-[1.02] transition-transform">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-indigo-100 text-sm font-medium mb-1">Total Soal</p>
                <h3 className="text-3xl font-black">{totalQuestions}</h3>
              </div>
              <div className="p-2 bg-white/20 rounded-lg"><FileText className="w-6 h-6" /></div>
            </div>
            <div className="mt-4"><span className="text-xs bg-indigo-700/50 px-2 py-1 rounded-md">Seluruh Bank Soal</span></div>
          </div>
        </Link>

        <Link href="/guru/siswa" className="block group">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 shadow-md text-white relative overflow-hidden group-hover:scale-[1.02] transition-transform">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-emerald-100 text-sm font-medium mb-1">Total Peserta</p>
                <h3 className="text-3xl font-black">{totalStudents}</h3>
              </div>
              <div className="p-2 bg-white/20 rounded-lg"><Users className="w-6 h-6" /></div>
            </div>
            <div className="mt-4"><span className="text-xs bg-emerald-700/50 px-2 py-1 rounded-md">Siswa Terdaftar</span></div>
          </div>
        </Link>

        <Link href="/guru/ujian" className="block group">
          <div className="bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl p-5 shadow-md text-white relative overflow-hidden group-hover:scale-[1.02] transition-transform">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-amber-100 text-sm font-medium mb-1">Total Ujian</p>
                <h3 className="text-3xl font-black">{exams.length}</h3>
              </div>
              <div className="p-2 bg-white/20 rounded-lg"><Trophy className="w-6 h-6" /></div>
            </div>
            <div className="mt-4"><span className="text-xs bg-amber-600/50 px-2 py-1 rounded-md">Ujian Dibuat</span></div>
          </div>
        </Link>

        <Link href="/guru/pengaturan" className="block group">
          <div className="bg-gradient-to-br from-sky-400 to-sky-500 rounded-2xl p-5 shadow-md text-white relative overflow-hidden group-hover:scale-[1.02] transition-transform">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sky-100 text-sm font-medium mb-1">Pengaturan</p>
                <h3 className="text-xl font-black mt-1">Identitas</h3>
              </div>
              <div className="p-2 bg-white/20 rounded-lg"><Settings className="w-6 h-6" /></div>
            </div>
            <div className="mt-4"><span className="text-xs bg-sky-700/50 px-2 py-1 rounded-md">Ubah Logo & Nama</span></div>
          </div>
        </Link>
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
          
          {/* Kalender Dinamis */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2"><CalendarIcon className="w-4 h-4 text-blue-500" /> Kalender</h2>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100 p-1 rounded-lg">
                <button onClick={prevMonth} className="p-1 hover:bg-white rounded shadow-sm"><ChevronLeft className="w-4 h-4" /></button>
                <span className="w-24 text-center">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
                <button onClick={nextMonth} className="p-1 hover:bg-white rounded shadow-sm"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-400 mb-2">
              {dayNames.map(d => <div key={d}>{d}</div>)}
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center text-sm text-slate-600">
              {/* Kosongkan hari sebelum tanggal 1 */}
              {Array.from({ length: firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1 }).map((_, i) => (
                <div key={`empty-${i}`} className="p-1.5"></div>
              ))}
              
              {/* Hari dalam bulan */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isToday = new Date().getDate() === day && new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();
                const hasEvent = hasExamOnDate(day);
                
                return (
                  <div key={day} className={`p-1.5 rounded-md relative cursor-pointer hover:bg-slate-50 transition ${
                    isToday ? 'bg-blue-600 text-white font-bold shadow-sm' : ''
                  }`}>
                    {day}
                    {hasEvent && !isToday && <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-amber-400 rounded-full"></div>}
                    {hasEvent && isToday && <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full"></div>}
                  </div>
                );
              })}
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