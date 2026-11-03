"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, BookMarked, Trash2, Filter, Layers, Plus, X, Save, 
  Check, Image as ImageIcon, ListChecks, ListTodo, ToggleLeft, Link, Shuffle, Type, FileText
} from "lucide-react";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Input } from "../../components/Input";
import { ImageUploader } from "../../components/ImageUploader";
import { TextEditor } from "../../components/TextEditor";
import { isLoggedIn } from "../../lib/auth";
import { fetchBankQuestions, deleteBankQuestion, saveQuestionToBank } from "../../lib/db";
import type { Question, QuestionType } from "../../lib/types";

const TIPE_LABEL: Record<string, string> = {
  multiple_choice: "PG", complex_mc: "PG KOMPLEKS", true_false: "B/S",
  multi_true_false: "B/S BERTINGKAT", matching: "JODOHKAN",
  ordering: "URUTKAN", short_answer: "ISIAN", essay: "ESAI",
};

const TIPE_SOAL: { value: QuestionType; label: string; icon: any }[] = [
  { value: "multiple_choice", label: "Pilihan Ganda", icon: ListChecks },
  { value: "complex_mc", label: "PG Kompleks", icon: ListTodo },
  { value: "true_false", label: "Benar / Salah", icon: ToggleLeft },
  { value: "multi_true_false", label: "B/S Bertingkat", icon: ListChecks },
  { value: "matching", label: "Menjodohkan", icon: Link },
  { value: "ordering", label: "Mengurutkan", icon: Shuffle },
  { value: "short_answer", label: "Isian Singkat", icon: Type },
  { value: "essay", label: "Esai", icon: FileText },
];

function createEmptyQuestion(type: QuestionType): Question {
  const base = { id: crypto.randomUUID(), type, question: "" };
  if (type === "multiple_choice") return { ...base, options: ["", "", "", ""], optionImages: [undefined, undefined, undefined, undefined], correctAnswer: "" };
  if (type === "complex_mc") return { ...base, options: ["", "", "", ""], optionImages: [undefined, undefined, undefined, undefined], correctAnswers: [] };
  if (type === "true_false") return { ...base, trueFalseAnswer: true };
  if (type === "multi_true_false") return { ...base, statements: [{ text: "", isTrue: true }, { text: "", isTrue: false }] };
  if (type === "matching") return { ...base, pairs: [{ left: "", right: "" }, { left: "", right: "" }] };
  if (type === "ordering") return { ...base, items: ["", "", ""] };
  if (type === "short_answer") return { ...base, acceptedAnswers: [""] };
  return base;
}

export default function BankSoalPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSubject, setFilterSubject] = useState("Semua");
  const [filterTopic, setFilterTopic] = useState("Semua");

  // State untuk Form Tambah Soal
  const [showFormModal, setShowFormModal] = useState(false);
  const [formSubject, setFormSubject] = useState("");
  const [formTopic, setFormTopic] = useState("");
  const [pilihTipe, setPilihTipe] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showOptImage, setShowOptImage] = useState<Record<number, boolean>>({});

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

  function openForm() {
    setFormSubject("");
    setFormTopic("");
    setEditingQuestion(null);
    setPilihTipe(true);
    setShowFormModal(true);
  }

  function closeForm() {
    setShowFormModal(false);
    setEditingQuestion(null);
  }

  function pilihTipeSoal(type: QuestionType) {
    setEditingQuestion(createEmptyQuestion(type));
    setPilihTipe(false);
    setShowOptImage({});
  }

  async function handleSaveSoal() {
    if (!editingQuestion || !formSubject.trim()) {
      alert("Mata Pelajaran wajib diisi.");
      return;
    }
    if (!editingQuestion.question.replace(/<[^>]*>?/gm, '').trim()) {
      alert("Pertanyaan tidak boleh kosong.");
      return;
    }

    // Validasi Dasar
    if (editingQuestion.type === "multiple_choice" || editingQuestion.type === "complex_mc") {
       const opts = editingQuestion.options || [];
       const hasEmptyOpt = opts.some((opt, i) => !opt.replace(/<[^>]*>?/gm, '').trim() && !editingQuestion.optionImages?.[i]);
       if (hasEmptyOpt) return alert("Semua pilihan harus diisi teks atau gambarnya.");
    }

    setIsSaving(true);
    const success = await saveQuestionToBank(editingQuestion, formSubject, formTopic);
    
    if (success) {
      alert("Soal berhasil ditambahkan ke Bank Soal!");
      closeForm();
      await loadData(); // Refresh daftar
    } else {
      alert("Gagal menyimpan soal.");
    }
    setIsSaving(false);
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
          
          <div className="flex flex-wrap items-center gap-2">
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

            <Button onClick={openForm} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
              <Plus className="w-4 h-4 mr-1.5" /> Tambah Soal
            </Button>
          </div>
        </div>

        {filteredQuestions.length === 0 ? (
          <Card className="p-12 text-center">
            <BookMarked className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700 mb-1">Bank Soal Kosong</p>
            <p className="text-sm text-slate-500">Klik "Tambah Soal" untuk mulai membuat koleksi soal Anda.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredQuestions.map((q, i) => (
              <Card key={q.id} className="p-4 hover:shadow-md transition">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 font-bold text-sm flex items-center justify-center shrink-0 mt-1">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 uppercase">{TIPE_LABEL[q.type] || q.type}</span>
                      <span className="text-xs text-slate-400">• {q.subject}</span>
                      {q.topic && <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">Bab: {q.topic}</span>}
                    </div>
                    <div className="font-medium text-slate-900 mb-2 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: q.question }} />
                    {q.image && <img src={q.image} className="max-h-24 rounded-lg border border-slate-200 mb-2" />}
                  </div>
                  <button onClick={() => handleDelete(q.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg shrink-0 mt-1" title="Hapus Soal">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* --- MODAL FORM TAMBAH SOAL --- */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
          <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col animate-fade-in-up">
            <div className="p-5 border-b flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Tambah Soal Baru</h3>
                <p className="text-xs text-slate-500">Buat soal dan simpan langsung ke Bank Soal.</p>
              </div>
              <button onClick={closeForm} className="p-2 hover:bg-slate-200 rounded-full text-slate-500"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-5 overflow-y-auto space-y-5 bg-slate-50/50">
              
              {/* Input Mapel & Bab */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                <Input 
                  id="formSubject" 
                  label="Mata Pelajaran (Wajib)" 
                  placeholder="Contoh: Matematika" 
                  value={formSubject} 
                  onChange={(e) => setFormSubject(e.target.value)} 
                />
                <Input 
                  id="formTopic" 
                  label="Bab / Topik (Opsional)" 
                  placeholder="Contoh: Tekanan Zat" 
                  value={formTopic} 
                  onChange={(e) => setFormTopic(e.target.value)} 
                />
              </div>

              {/* Pilih Tipe Soal (Jika belum memilih) */}
              {pilihTipe && !editingQuestion && (
                <Card className="p-5 border-emerald-200 ring-1 ring-emerald-500/20 bg-white">
                  <h3 className="font-semibold text-slate-900 mb-4">Pilih Tipe Soal</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {TIPE_SOAL.map((t) => {
                      const Icon = t.icon;
                      return (
                        <button key={t.value} onClick={() => pilihTipeSoal(t.value)} className="p-3 rounded-xl border-2 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition text-left flex flex-col items-center justify-center gap-2">
                          <Icon className="w-5 h-5 text-emerald-600" />
                          <p className="font-semibold text-xs text-slate-900 text-center">{t.label}</p>
                        </button>
                      );
                    })}
                  </div>
                </Card>
              )}

              {/* Form Editor Soal (Jika sudah memilih tipe) */}
              {editingQuestion && (
                <Card className="p-5 bg-white border-emerald-200 ring-1 ring-emerald-500/20">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 uppercase">{TIPE_LABEL[editingQuestion.type]}</span>
                      <h3 className="font-bold text-slate-900 mt-1">Editor Soal</h3>
                    </div>
                    <button onClick={() => { setEditingQuestion(null); setPilihTipe(true); }} className="text-xs font-semibold text-red-500 hover:bg-red-50 px-2 py-1 rounded">Ganti Tipe</button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Pertanyaan / Instruksi</label>
                      <TextEditor value={editingQuestion.question} onChange={(val) => setEditingQuestion({ ...editingQuestion, question: val })} placeholder="Tulis pertanyaan di sini..." />
                    </div>
                    <ImageUploader value={editingQuestion.image} onChange={(img) => setEditingQuestion({ ...editingQuestion, image: img })} />

                    {/* Render Field Berdasarkan Tipe Soal */}
                    {editingQuestion.type === "multiple_choice" && (
                      <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                        {editingQuestion.options?.map((opt, i) => (
                          <div key={i} className="flex flex-col gap-2 p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
                            <div className="flex gap-2 items-center">
                              <button onClick={() => setEditingQuestion({...editingQuestion, correctAnswer: opt || `Opsi ${i+1}`})} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 ${editingQuestion.correctAnswer === (opt || `Opsi ${i+1}`) ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300"}`}>{editingQuestion.correctAnswer === (opt || `Opsi ${i+1}`) ? <Check className="w-4 h-4"/> : String.fromCharCode(65+i)}</button>
                              <div className="flex-1"><TextEditor value={opt} onChange={(val) => { const o = [...(editingQuestion.options||[])]; o[i] = val; setEditingQuestion({...editingQuestion, options: o, correctAnswer: editingQuestion.correctAnswer === opt ? val : editingQuestion.correctAnswer}) }} placeholder={`Teks Opsi ${String.fromCharCode(65+i)}`} /></div>
                              <button onClick={() => setShowOptImage(prev => ({...prev, [i]: !prev[i]}))} className={`p-2 rounded-lg border ${showOptImage[i] ? 'bg-blue-50 text-blue-600 border-blue-200' : 'text-slate-400 border-transparent hover:bg-slate-100'}`} title="Tambah Gambar"><ImageIcon className="w-4 h-4"/></button>
                            </div>
                            {showOptImage[i] && <div className="mt-2 pl-10"><ImageUploader value={editingQuestion.optionImages?.[i]} onChange={(img) => { const imgs = [...(editingQuestion.optionImages||[])]; imgs[i] = img; setEditingQuestion({...editingQuestion, optionImages: imgs}) }} /></div>}
                          </div>
                        ))}
                      </div>
                    )}

                    {editingQuestion.type === "complex_mc" && (
                      <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <p className="text-xs text-slate-500">Centang lebih dari satu jika perlu.</p>
                        {editingQuestion.options?.map((opt, i) => {
                          const identifier = opt || `Opsi ${i+1}`;
                          const isSelected = editingQuestion.correctAnswers?.includes(identifier);
                          return (
                            <div key={i} className="flex flex-col gap-2 p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
                              <div className="flex gap-2 items-center">
                                <input type="checkbox" checked={isSelected} onChange={() => {
                                  const curr = editingQuestion.correctAnswers || [];
                                  const newAns = isSelected ? curr.filter(a => a !== identifier) : [...curr, identifier];
                                  setEditingQuestion({...editingQuestion, correctAnswers: newAns});
                                }} className="w-5 h-5 accent-emerald-600 shrink-0" />
                                <div className="flex-1"><TextEditor value={opt} onChange={(val) => { const o = [...(editingQuestion.options||[])]; o[i] = val; setEditingQuestion({...editingQuestion, options: o}) }} placeholder={`Teks Opsi ${String.fromCharCode(65+i)}`} /></div>
                                <button onClick={() => setShowOptImage(prev => ({...prev, [i]: !prev[i]}))} className={`p-2 rounded-lg border ${showOptImage[i] ? 'bg-blue-50 text-blue-600 border-blue-200' : 'text-slate-400 border-transparent hover:bg-slate-100'}`} title="Tambah Gambar"><ImageIcon className="w-4 h-4"/></button>
                              </div>
                              {showOptImage[i] && <div className="mt-2 pl-8"><ImageUploader value={editingQuestion.optionImages?.[i]} onChange={(img) => { const imgs = [...(editingQuestion.optionImages||[])]; imgs[i] = img; setEditingQuestion({...editingQuestion, optionImages: imgs}) }} /></div>}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {editingQuestion.type === "true_false" && (
                      <div className="flex gap-3">
                        {[true, false].map(val => (
                          <button key={String(val)} onClick={() => setEditingQuestion({...editingQuestion, trueFalseAnswer: val})} className={`flex-1 py-3 border-2 rounded-xl font-semibold ${editingQuestion.trueFalseAnswer === val ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "border-slate-200"}`}>{val ? "Benar" : "Salah"}</button>
                        ))}
                      </div>
                    )}

                    {editingQuestion.type === "multi_true_false" && (
                      <div className="space-y-3">
                        {editingQuestion.statements?.map((st, i) => (
                          <div key={i} className="flex gap-2 items-center">
                            <input value={st.text} onChange={(e) => { const s = [...(editingQuestion.statements||[])]; s[i].text = e.target.value; setEditingQuestion({...editingQuestion, statements: s}) }} placeholder="Pernyataan..." className="flex-1 px-3 py-2 border rounded-lg" />
                            <select value={String(st.isTrue)} onChange={(e) => { const s = [...(editingQuestion.statements||[])]; s[i].isTrue = e.target.value === "true"; setEditingQuestion({...editingQuestion, statements: s}) }} className="px-3 py-2 border rounded-lg bg-white">
                              <option value="true">Benar</option><option value="false">Salah</option>
                            </select>
                            <button onClick={() => { const s = editingQuestion.statements?.filter((_,idx) => idx !== i); setEditingQuestion({...editingQuestion, statements: s}) }} className="text-red-500"><Trash2 className="w-4 h-4"/></button>
                          </div>
                        ))}
                        <Button variant="secondary" size="sm" onClick={() => setEditingQuestion({...editingQuestion, statements: [...(editingQuestion.statements||[]), {text: "", isTrue: true}]})}><Plus className="w-3 h-3 mr-1"/>Tambah Pernyataan</Button>
                      </div>
                    )}

                    {editingQuestion.type === "matching" && (
                      <div className="space-y-3">
                        {editingQuestion.pairs?.map((p, i) => (
                          <div key={i} className="flex gap-2 items-center">
                            <input value={p.left} onChange={(e) => { const pr = [...(editingQuestion.pairs||[])]; pr[i].left = e.target.value; setEditingQuestion({...editingQuestion, pairs: pr}) }} placeholder="Kiri (Soal)" className="flex-1 px-3 py-2 border rounded-lg" />
                            <span className="text-slate-400">→</span>
                            <input value={p.right} onChange={(e) => { const pr = [...(editingQuestion.pairs||[])]; pr[i].right = e.target.value; setEditingQuestion({...editingQuestion, pairs: pr}) }} placeholder="Kanan (Jawaban)" className="flex-1 px-3 py-2 border rounded-lg" />
                            <button onClick={() => { const pr = editingQuestion.pairs?.filter((_,idx) => idx !== i); setEditingQuestion({...editingQuestion, pairs: pr}) }} className="text-red-500"><Trash2 className="w-4 h-4"/></button>
                          </div>
                        ))}
                        <Button variant="secondary" size="sm" onClick={() => setEditingQuestion({...editingQuestion, pairs: [...(editingQuestion.pairs||[]), {left:"", right:""}]})}><Plus className="w-3 h-3 mr-1"/>Tambah Pasangan</Button>
                      </div>
                    )}

                    {editingQuestion.type === "ordering" && (
                      <div className="space-y-2">
                        <p className="text-xs text-slate-500">Masukkan item sesuai urutan yang BENAR.</p>
                        {editingQuestion.items?.map((it, i) => (
                          <div key={i} className="flex gap-2 items-center">
                            <span className="w-6 text-center font-bold text-slate-400">{i+1}.</span>
                            <input value={it} onChange={(e) => { const items = [...(editingQuestion.items||[])]; items[i] = e.target.value; setEditingQuestion({...editingQuestion, items}) }} className="flex-1 px-3 py-2 border rounded-lg" />
                            <button onClick={() => { const items = editingQuestion.items?.filter((_,idx) => idx !== i); setEditingQuestion({...editingQuestion, items}) }} className="text-red-500"><Trash2 className="w-4 h-4"/></button>
                          </div>
                        ))}
                        <Button variant="secondary" size="sm" onClick={() => setEditingQuestion({...editingQuestion, items: [...(editingQuestion.items||[]), ""]})}><Plus className="w-3 h-3 mr-1"/>Tambah Item</Button>
                      </div>
                    )}

                    {editingQuestion.type === "short_answer" && (
                      <div className="space-y-2">
                        <p className="text-xs text-slate-500">Diterima (pisahkan dengan enter/koma).</p>
                        {editingQuestion.acceptedAnswers?.map((ans, i) => (
                          <div key={i} className="flex gap-2 items-center">
                            <input value={ans} onChange={(e) => { const a = [...(editingQuestion.acceptedAnswers||[])]; a[i] = e.target.value; setEditingQuestion({...editingQuestion, acceptedAnswers: a}) }} className="flex-1 px-3 py-2 border rounded-lg" />
                            <button onClick={() => { const a = editingQuestion.acceptedAnswers?.filter((_,idx) => idx !== i); setEditingQuestion({...editingQuestion, acceptedAnswers: a}) }} className="text-red-500"><Trash2 className="w-4 h-4"/></button>
                          </div>
                        ))}
                        <Button variant="secondary" size="sm" onClick={() => setEditingQuestion({...editingQuestion, acceptedAnswers: [...(editingQuestion.acceptedAnswers||[]), ""]})}><Plus className="w-3 h-3 mr-1"/>Tambah Alternatif</Button>
                      </div>
                    )}

                    {editingQuestion.type === "essay" && (
                      <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-sm text-amber-800">
                        Soal esai tidak dinilai otomatis. Siswa akan mengetik jawaban panjang. Guru harus memeriksa dan menilai manual.
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>
            
            <div className="p-4 border-t bg-slate-50 rounded-b-2xl flex justify-end gap-2">
               <Button variant="secondary" onClick={closeForm}>Batal</Button>
               <Button 
                  onClick={handleSaveSoal} 
                  disabled={isSaving || !editingQuestion || !formSubject.trim()} 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
               >
                 <Save className="w-4 h-4 mr-1.5" />
                 {isSaving ? "Menyimpan..." : "Simpan ke Bank"}
               </Button>
            </div>
          </Card>
        </div>
      )}
    </main>
  );
}