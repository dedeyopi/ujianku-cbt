"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Save, Plus, Trash2, Edit3, Check, X, BookOpen,
  CheckCircle2, AlertCircle, ListChecks, ToggleLeft, Type,
  ListTodo, Shuffle, Link, FileText, Upload, FileSpreadsheet, Image as ImageIcon
} from "lucide-react";
import { Button } from "./Button";
import { Card } from "./Card";
import { Input } from "./Input";
import { ImageUploader } from "./ImageUploader";
import { TextEditor } from "./TextEditor"; // Import TextEditor baru
import { fetchExamById, saveExam } from "../lib/db";
import { isLoggedIn } from "../lib/auth";
import { downloadTemplateImport, parseExcelToQuestions } from "../lib/excel";
import type { Exam, Question, QuestionType } from "../lib/types";

type Props = { examId?: string };

function createEmptyExam(): Exam {
  return {
    id: crypto.randomUUID(), title: "", subject: "", duration: 600,
    questions: [], createdAt: new Date().toISOString(), isActive: false,
  };
}

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

const TIPE_LABEL: Record<QuestionType, string> = {
  multiple_choice: "PG", complex_mc: "PG Kompleks", true_false: "B/S",
  multi_true_false: "B/S Bertingkat", matching: "Jodohkan",
  ordering: "Urutkan", short_answer: "Isian", essay: "Esai",
};

export function ExamEditor({ examId }: Props) {
  const router = useRouter();
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isNewQuestion, setIsNewQuestion] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [pilihTipe, setPilihTipe] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showOptImage, setShowOptImage] = useState<Record<number, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadData() {
      const logged = await isLoggedIn();
      if (!logged) { router.push("/guru/login"); return; }

      if (examId) {
        const found = await fetchExamById(examId);
        if (!found) { router.push("/guru"); return; }
        setExam(found);
      } else {
        setExam(createEmptyExam());
      }
      setLoading(false);
    }
    loadData();
  }, [examId, router]);

  useEffect(() => {
    if (!exam || loading) return;
    const hasContent = exam.title.trim() !== "" || exam.questions.length > 0;
    if (!hasContent) return;

    const timer = setTimeout(async () => {
      const success = await saveExam(exam);
      if (success) {
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 1500);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [exam, loading]);

  function updateExam(patch: Partial<Exam>) { if (exam) setExam({ ...exam, ...patch }); }
  function pilihTipeSoal(type: QuestionType) { setEditingQuestion(createEmptyQuestion(type)); setIsNewQuestion(true); setPilihTipe(false); setShowOptImage({}); }
  function cancelQuestionForm() { setEditingQuestion(null); setIsNewQuestion(false); setPilihTipe(false); setShowOptImage({}); }
  function openEditQuestion(q: Question) { setEditingQuestion(JSON.parse(JSON.stringify(q))); setIsNewQuestion(false); setShowOptImage({}); }

  function saveQuestion() {
    if (!exam || !editingQuestion) return;
    // Cek jika pertanyaan kosong (mengabaikan tag html seperti <br> atau <p>)
    const strippedQuestion = editingQuestion.question.replace(/<[^>]*>?/gm, '').trim();
    if (!strippedQuestion) return alert("Pertanyaan tidak boleh kosong.");
    
    if (editingQuestion.type === "multiple_choice" || editingQuestion.type === "complex_mc") {
       const opts = editingQuestion.options || [];
       const hasEmptyOpt = opts.some((opt, i) => !opt.replace(/<[^>]*>?/gm, '').trim() && !editingQuestion.optionImages?.[i]);
       if (hasEmptyOpt) return alert("Semua pilihan harus diisi teks atau gambarnya.");
    }

    if (isNewQuestion) updateExam({ questions: [...exam.questions, editingQuestion] });
    else updateExam({ questions: exam.questions.map((q) => q.id === editingQuestion.id ? editingQuestion : q) });
    
    setEditingQuestion(null); setIsNewQuestion(false); setShowOptImage({}); 
  }

  function deleteQuestion(id: string) {
    if (!exam || !confirm("Hapus soal ini?")) return;
    updateExam({ questions: exam.questions.filter((q) => q.id !== id) });
  }

  async function handleImportExcel(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file || !exam) return;
    setIsImporting(true);
    try {
      const imported = await parseExcelToQuestions(file);
      updateExam({ questions: [...exam.questions, ...imported] });
      alert(`Berhasil mengimpor ${imported.length} soal!`);
    } catch (err) { alert("Gagal mengimpor."); }
    setIsImporting(false);
  }

  if (loading || !exam) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p className="text-sm text-slate-500 animate-pulse">Memuat editor...</p></div>;
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white/80 border-b border-slate-200 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.push("/guru")}><ArrowLeft className="w-4 h-4 mr-1.5" />Kembali</Button>
          <div className="flex items-center gap-3">
            {savedFlash && <span className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />Tersimpan</span>}
            <Button variant={exam.isActive ? "success" : "secondary"} size="sm" onClick={() => updateExam({ isActive: !exam.isActive })}>
              {exam.isActive ? "Aktif" : "Nonaktif"}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 pt-6 space-y-6">
        <Card className="p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Info Ujian</h2>
          <div className="space-y-4">
            <Input id="title" label="Judul Ujian" value={exam.title} onChange={(e) => updateExam({ title: e.target.value })} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input id="subject" label="Mata Pelajaran" value={exam.subject} onChange={(e) => updateExam({ subject: e.target.value })} />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Durasi (menit)</label>
                <input type="number" min={1} value={Math.floor(exam.duration / 60)} onChange={(e) => updateExam({ duration: Math.max(1, Number(e.target.value) || 1) * 60 })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition" />
              </div>
            </div>
          </div>
        </Card>

        <div>
          <div className="flex flex-col sm:flex-row justify-between gap-3 mb-3">
            <div>
              <h2 className="font-semibold text-slate-900">Daftar Soal ({exam.questions.length})</h2>
              <p className="text-xs text-slate-500">Mendukung 8 tipe soal</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="secondary" size="sm" onClick={downloadTemplateImport}><FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-600" />Template</Button>
              <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isImporting}><Upload className="w-4 h-4 mr-1.5 text-blue-600" />{isImporting ? "..." : "Import"}</Button>
              <input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleImportExcel} />
              {!editingQuestion && !pilihTipe && (
                <button onClick={() => setPilihTipe(true)} className="inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] px-3 py-1.5 text-sm bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm">
                  <Plus className="w-4 h-4 mr-1.5" />Tambah
                </button>
              )}
            </div>
          </div>

          {pilihTipe && (
            <Card className="p-5 mb-3 border-emerald-200 ring-1 ring-emerald-500/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">Pilih Tipe Soal</h3>
                <button onClick={() => setPilihTipe(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-4 h-4" /></button>
              </div>
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

          {exam.questions.map((q, index) => (
            <Card key={q.id} className="p-4 mb-3">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0">{index + 1}</div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 uppercase mb-2 inline-block">{TIPE_LABEL[q.type]}</span>
                  {/* Render HTML untuk daftar soal */}
                  <div className="font-medium text-slate-900 mb-2 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: q.question }} />
                  {q.image && <img src={q.image} className="max-h-24 rounded-lg border border-slate-200 mb-2" />}
                  
                  {q.type === "multiple_choice" && <div className="text-xs text-emerald-600">Kunci: {q.correctAnswer?.replace(/<[^>]*>?/gm, '')}</div>}
                  {q.type === "complex_mc" && <div className="text-xs text-emerald-600">Kunci: {q.correctAnswers?.map(a => a.replace(/<[^>]*>?/gm, '')).join(", ")}</div>}
                  {q.type === "true_false" && <div className="text-xs text-emerald-600">Kunci: {q.trueFalseAnswer ? "Benar" : "Salah"}</div>}
                  {q.type === "multi_true_false" && <div className="text-xs text-emerald-600">{q.statements?.length} Pernyataan</div>}
                  {q.type === "matching" && <div className="text-xs text-emerald-600">{q.pairs?.length} Pasangan</div>}
                  {q.type === "ordering" && <div className="text-xs text-emerald-600">{q.items?.length} Item</div>}
                  {q.type === "short_answer" && <div className="text-xs text-emerald-600">Diterima: {q.acceptedAnswers?.join(" / ")}</div>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEditQuestion(q)} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => deleteQuestion(q.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </Card>
          ))}

          {editingQuestion && (
            <Card className="p-5 mt-3 border-emerald-200 ring-1 ring-emerald-500/20 animate-fade-in-up">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-900">{TIPE_LABEL[editingQuestion.type]}</h3>
                <button onClick={cancelQuestionForm} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Pertanyaan / Instruksi</label>
                  <TextEditor 
                    value={editingQuestion.question} 
                    onChange={(val) => setEditingQuestion({ ...editingQuestion, question: val })} 
                    placeholder="Tulis pertanyaan di sini..."
                  />
                </div>
                <ImageUploader value={editingQuestion.image} onChange={(img) => setEditingQuestion({ ...editingQuestion, image: img })} />

                {editingQuestion.type === "multiple_choice" && (
                  <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    {editingQuestion.options?.map((opt, i) => (
                      <div key={i} className="flex flex-col gap-2 p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
                        <div className="flex gap-2 items-center">
                          <button onClick={() => setEditingQuestion({...editingQuestion, correctAnswer: opt || `Opsi ${i+1}`})} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 ${editingQuestion.correctAnswer === (opt || `Opsi ${i+1}`) ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300"}`}>{editingQuestion.correctAnswer === (opt || `Opsi ${i+1}`) ? <Check className="w-4 h-4"/> : String.fromCharCode(65+i)}</button>
                          
                          <div className="flex-1">
                            <TextEditor 
                              value={opt} 
                              onChange={(val) => { const o = [...(editingQuestion.options||[])]; o[i] = val; setEditingQuestion({...editingQuestion, options: o, correctAnswer: editingQuestion.correctAnswer === opt ? val : editingQuestion.correctAnswer}) }} 
                              placeholder={`Teks Opsi ${String.fromCharCode(65+i)}`}
                            />
                          </div>

                          <button onClick={() => setShowOptImage(prev => ({...prev, [i]: !prev[i]}))} className={`p-2 rounded-lg border ${showOptImage[i] ? 'bg-blue-50 text-blue-600 border-blue-200' : 'text-slate-400 border-transparent hover:bg-slate-100'}`} title="Tambah Gambar"><ImageIcon className="w-4 h-4"/></button>
                        </div>
                        {showOptImage[i] && (
                          <div className="mt-2 pl-10">
                             <ImageUploader value={editingQuestion.optionImages?.[i]} onChange={(img) => { const imgs = [...(editingQuestion.optionImages||[])]; imgs[i] = img; setEditingQuestion({...editingQuestion, optionImages: imgs}) }} />
                          </div>
                        )}
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
                            
                            <div className="flex-1">
                              <TextEditor 
                                value={opt} 
                                onChange={(val) => { const o = [...(editingQuestion.options||[])]; o[i] = val; setEditingQuestion({...editingQuestion, options: o}) }} 
                                placeholder={`Teks Opsi ${String.fromCharCode(65+i)}`}
                              />
                            </div>
                            
                            <button onClick={() => setShowOptImage(prev => ({...prev, [i]: !prev[i]}))} className={`p-2 rounded-lg border ${showOptImage[i] ? 'bg-blue-50 text-blue-600 border-blue-200' : 'text-slate-400 border-transparent hover:bg-slate-100'}`} title="Tambah Gambar"><ImageIcon className="w-4 h-4"/></button>
                          </div>
                          {showOptImage[i] && (
                            <div className="mt-2 pl-8">
                              <ImageUploader value={editingQuestion.optionImages?.[i]} onChange={(img) => { const imgs = [...(editingQuestion.optionImages||[])]; imgs[i] = img; setEditingQuestion({...editingQuestion, optionImages: imgs}) }} />
                            </div>
                          )}
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

                <div className="flex gap-2 pt-4 border-t border-slate-100">
                  <Button variant="secondary" className="flex-1" onClick={cancelQuestionForm}>Batal</Button>
                  <button onClick={saveQuestion} className="flex-1 inline-flex items-center justify-center font-semibold rounded-xl px-5 py-2.5 text-sm bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"><Save className="w-4 h-4 mr-1.5" />Simpan Soal</button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}