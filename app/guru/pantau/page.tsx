"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MonitorPlay, AlertTriangle, CheckCircle2, UserX, Search, ArrowDownAZ } from "lucide-react";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { supabase } from "../../lib/supabase";
import { isLoggedIn } from "../../lib/auth";
import type { ActiveSession } from "../../lib/types";

function mapDbSessionToActiveSession(dbS: any): ActiveSession {
  return {
    id: dbS.id, 
    examId: dbS.exam_id, 
    studentId: dbS.student_id,
    studentName: dbS.student_name, 
    className: dbS.class_name,
    currentQuestion: dbS.current_question || 0, 
    totalQuestions: dbS.total_questions || 0,
    violations: dbS.violations || 0, 
    lastSeen: dbS.last_seen,
    startedAt: dbS.started_at, // <-- TAMBAHKAN INI
    tabId: dbS.tab_id,         // <-- TAMBAHKAN INI
  };
}

export default function PantauUjianPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "progress">("name");

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function init() {
      const loggedIn = await isLoggedIn();
      if (!loggedIn) { router.push("/guru/login"); return; }

      const { data } = await supabase.from("active_sessions").select("*");
      if (data) setSessions(data.map(mapDbSessionToActiveSession));
      setLoading(false);

      const channel = supabase.channel("schema-db-changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "active_sessions" }, (payload) => {
            if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
              const newSession = mapDbSessionToActiveSession(payload.new);
              setSessions(prev => {
                const existing = prev.find(s => s.id === newSession.id);
                if (existing) return prev.map(s => s.id === newSession.id ? newSession : s);
                return [...prev, newSession];
              });
            } else if (payload.eventType === "DELETE") {
              setSessions(prev => prev.filter(s => s.id !== payload.old.id));
            }
          }
        ).subscribe();

      return () => { supabase.removeChannel(channel); };
    }
    init();
  }, [router]);

  // Filter dan Sortir Data
  const processedSessions = useMemo(() => {
    let result = sessions;

    // 1. Filter yang online (terakhir terlihat < 30 detik lalu)
    if (now > 0) {
      result = result.filter(s => (now - new Date(s.lastSeen).getTime()) < 30000);
    }

    // 2. Filter berdasarkan pencarian nama/kelas
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.studentName.toLowerCase().includes(lowerQuery) || 
        s.className.toLowerCase().includes(lowerQuery)
      );
    }

    // 3. Sortir
    result.sort((a, b) => {
      if (sortBy === "name") return a.studentName.localeCompare(b.studentName);
      // Sort by progress (persentase soal yang dikerjakan)
      const progressA = a.totalQuestions > 0 ? (a.currentQuestion / a.totalQuestions) : 0;
      const progressB = b.totalQuestions > 0 ? (b.currentQuestion / b.totalQuestions) : 0;
      return progressB - progressA;
    });

    return result;
  }, [sessions, now, searchQuery, sortBy]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p className="text-sm text-slate-500 animate-pulse">Memuat data...</p></div>;
  }

  const getStatus = (lastSeen: string) => {
    if (now === 0) return { label: "Memuat", color: "text-slate-500 bg-slate-100", dot: "bg-slate-400" };
    const diff = now - new Date(lastSeen).getTime();
    if (diff < 30000) return { label: "Online", color: "text-emerald-600 bg-emerald-50", dot: "bg-emerald-500" };
    return { label: "Terputus", color: "text-slate-500 bg-slate-100", dot: "bg-slate-400" };
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.push("/guru")}>
            <ArrowLeft className="w-4 h-4 mr-1.5" />Kembali
          </Button>
          <div className="flex items-center gap-2">
            <MonitorPlay className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-900 text-sm">Live Exam Monitor</span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 pt-6">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Pantauan Real-time</h2>
            <p className="text-sm text-slate-500">Memantau {processedSessions.length} siswa yang sedang aktif</p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Cari nama/kelas..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 w-full sm:w-64"
              />
            </div>
            
            {/* Sort Dropdown */}
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as any)} 
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <option value="name">Urut Abjad</option>
              <option value="progress">Urut Progress</option>
            </select>
          </div>
        </div>

        {processedSessions.length === 0 ? (
          <Card className="p-12 text-center">
            <UserX className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700 mb-1">Belum ada siswa aktif</p>
            <p className="text-sm text-slate-500">Siswa yang membuka ujian akan muncul di sini.</p>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 w-12 text-center">No</th>
                    <th className="px-4 py-3">Nama Siswa</th>
                    <th className="px-4 py-3">Kelas</th>
                    <th className="px-4 py-3 text-center">Progress</th>
                    <th className="px-4 py-3 text-center">Pelanggaran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {processedSessions.map((s, index) => {
                    const status = getStatus(s.lastSeen);
                    const progressPercent = s.totalQuestions > 0 ? Math.round((s.currentQuestion / s.totalQuestions) * 100) : 0;
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-4 py-3 text-center text-slate-500 font-medium">{index + 1}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">{s.studentName}</p>
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${status.color} mt-1`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${status.dot} animate-pulse`}></span>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{s.className}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-100 rounded-full h-2">
                              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${progressPercent}%` }}></div>
                            </div>
                            <span className="text-xs font-semibold text-slate-600 w-12 text-right">Soal {s.currentQuestion}/{s.totalQuestions}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {s.violations > 0 ? (
                            <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded text-xs font-semibold">
                              <AlertTriangle className="w-3 h-3" />{s.violations}x
                            </span>
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}