"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookMarked, Trash2, Filter, Layers } from "lucide-react";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { isLoggedIn } from "../../lib/auth";
import { fetchBankQuestions, deleteBankQuestion } from "../../lib/db";
import type { Question } from "../../lib/types";

const TIPE_LABEL: Record<string, string> = {
  multiple_choice: "PG", complex_mc: "PG Kompleks", true_false: "B/S",
  multi_true_false: "B/S Bertingkat", matching: "Jodohkan",
  ordering: "Urutkan", short_answer: "Isian", essay: "Esai",
};

export default function BankSoalPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSubject, setFilterSubject] = useState("Semua");
  const [filterTopic, setFilterTopic] = useState("Semua");

  async function loadData() {
    const loggedIn = await isLoggedIn();
    if (!loggedIn) { router.push("/guru/login"); return; }
    const data = await fetchBankQuestions();
    setQuestions(data);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, [router]);

  async function handleDelete(id: string) {
    if (!confirm("Hapus soal ini dari Bank Soal?")) return;
    const success = await deleteBankQuestion(id);
    if (success) setQuestions(questions.filter(q => q.id !== id));
  }

  const subjects = useMemo(() => ["Semua", ...Array.from(new Set(questions.map(q => q.subject).filter(Boolean))).sort()], [questions]);
  const topics = useMemo(() => ["Semua", ...Array.from(new Set(questions.map(q => q.topic).filter(Boolean))).sort()], [questions]);

  const filteredQuestions = questions.filter(q => {
    const matchSubject = filterSubject === "Semua" || q.subject === filterSubject;
    const matchTopic = filterTopic === "Semua" || q.topic === filterTopic;
    return matchSubject && matchTopic;
  });

  if (loading) return null;

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.push("/guru")}>
            <ArrowLeft className="w-4 h-4 mr-1.5" />Kembali
          </Button>
          <div className="flex items-center gap-2">
            <BookMarked className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-slate-900 text-sm">Bank Soal</span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 pt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Koleksi Soal Anda ({filteredQuestions.length})</h2>
            <p className="text-sm text-slate-500">Soal di sini dapat digunakan ulang untuk ujian apa pun.</p>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 bg-white px-3 py-2 border rounded-xl shadow-sm">
              <Filter className="w-4 h-4 text-slate-400" />
              <select value={filterSubject} onChange={(e) => { setFilterSubject(e.target.value); setFilterTopic("Semua"); }} className="text-sm focus:outline-none bg-transparent">
                {subjects.map(s => <option key={s} value={s}>{s === "Semua" ? "Semua Mapel" : s}</option>)}
              </select>
            </div>
            
            {filterSubject !== "Semua" && topics.length > 1 && (
              <div className="flex items-center gap-2 bg-white px-3 py-2 border rounded-xl shadow-sm">
                <Layers className="w-4 h-4 text-slate-400" />
                <select value={filterTopic} onChange={(e) => setFilterTopic(e.target.value)} className="text-sm focus:outline-none bg-transparent">
                  {topics.map(t => <option key={t} value={t}>{t === "Semua" ? "Semua Bab" : t}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        {filteredQuestions.length === 0 ? (
          <Card className="p-12 text-center">
            <BookMarked className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700 mb-1">Bank Soal Kosong</p>
            <p className="text-sm text-slate-500">Buat soal di editor ujian, lalu centang dan simpan ke Bank Soal.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredQuestions.map((q) => (
              <Card key={q.id} className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 uppercase">{TIPE_LABEL[q.type]}</span>
                      <span className="text-xs text-slate-400">• {q.subject}</span>
                      {q.topic && <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Bab: {q.topic}</span>}
                    </div>
                    <div className="font-medium text-slate-900 mb-2 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: q.question }} />
                    {q.image && <img src={q.image} className="max-h-24 rounded-lg border border-slate-200 mb-2" />}
                  </div>
                  <button onClick={() => handleDelete(q.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}