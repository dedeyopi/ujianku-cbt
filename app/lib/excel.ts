import * as XLSX from "xlsx";
import type { Question, QuestionType, ExamResult } from "./types";

// ==========================================
// B8: IMPORT SOAL DARI EXCEL
// ==========================================

export function downloadTemplateImport() {
  const template = [
    {
      Tipe: "PG",
      Pertanyaan: "2 + 2 = ?",
      "Pilihan A": "3",
      "Pilihan B": "4",
      "Pilihan C": "5",
      "Pilihan D": "6",
      "Kunci Jawaban": "4",
      "Data Tambahan (Pisahkan dgn | atau ;)": "",
    },
    {
      Tipe: "PG Kompleks",
      Pertanyaan: "Manakah bilangan prima?",
      "Pilihan A": "2",
      "Pilihan B": "3",
      "Pilihan C": "4",
      "Pilihan D": "5",
      "Kunci Jawaban": "2|3|5",
      "Data Tambahan (Pisahkan dgn | atau ;)": "",
    },
    {
      Tipe: "B/S",
      Pertanyaan: "Matahari terbit dari timur.",
      "Pilihan A": "",
      "Pilihan B": "",
      "Pilihan C": "",
      "Pilihan D": "",
      "Kunci Jawaban": "Benar",
      "Data Tambahan (Pisahkan dgn | atau ;)": "",
    },
    {
      Tipe: "B/S Bertingkat",
      Pertanyaan: "Periksa pernyataan berikut:",
      "Pilihan A": "",
      "Pilihan B": "",
      "Pilihan C": "",
      "Pilihan D": "",
      "Kunci Jawaban": "",
      "Data Tambahan (Pisahkan dgn | atau ;)": "Bumi bulat|Benar; Bumi datar|Salah",
    },
    {
      Tipe: "Menjodohkan",
      Pertanyaan: "Jodohkan negara dengan ibukotanya:",
      "Pilihan A": "",
      "Pilihan B": "",
      "Pilihan C": "",
      "Pilihan D": "",
      "Kunci Jawaban": "",
      "Data Tambahan (Pisahkan dgn | atau ;)": "Indonesia|Jakarta; Jepang|Tokyo",
    },
    {
      Tipe: "Mengurutkan",
      Pertanyaan: "Urutkan dari terkecil:",
      "Pilihan A": "",
      "Pilihan B": "",
      "Pilihan C": "",
      "Pilihan D": "",
      "Kunci Jawaban": "",
      "Data Tambahan (Pisahkan dgn | atau ;)": "Satu; Dua; Tiga",
    },
    {
      Tipe: "Isian",
      Pertanyaan: "Ibukota Indonesia adalah...",
      "Pilihan A": "",
      "Pilihan B": "",
      "Pilihan C": "",
      "Pilihan D": "",
      "Kunci Jawaban": "Jakarta",
      "Data Tambahan (Pisahkan dgn | atau ;)": "DKI Jakarta, DKI",
    },
    {
      Tipe: "Esai",
      Pertanyaan: "Jelaskan proses fotosintesis!",
      "Pilihan A": "",
      "Pilihan B": "",
      "Pilihan C": "",
      "Pilihan D": "",
      "Kunci Jawaban": "",
      "Data Tambahan (Pisahkan dgn | atau ;)": "",
    },
  ];

  const ws = XLSX.utils.json_to_sheet(template);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Template Soal");
  XLSX.writeFile(wb, "Template_Import_Soal_UjianKu_Pro.xlsx");
}

export async function parseExcelToQuestions(file: File): Promise<Question[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(firstSheet) as any[];

        const questions: Question[] = rows.map((row) => {
          const tipeRaw = String(row["Tipe"] || "").toLowerCase();
          const extra = String(row["Data Tambahan (Pisahkan dgn | atau ;)"] || "");
          const kunci = String(row["Kunci Jawaban"] || "");
          
          let type: QuestionType = "multiple_choice";
          if (tipeRaw.includes("kompleks")) type = "complex_mc";
          else if (tipeRaw.includes("bertingkat")) type = "multi_true_false";
          else if (tipeRaw.includes("jodoh")) type = "matching";
          else if (tipeRaw.includes("urut")) type = "ordering";
          else if (tipeRaw === "b/s" || tipeRaw.includes("benar")) type = "true_false";
          else if (tipeRaw.includes("isian")) type = "short_answer";
          else if (tipeRaw.includes("esai")) type = "essay";

          const q: Question = {
            id: crypto.randomUUID(),
            type,
            question: String(row["Pertanyaan"] || ""),
          };

          if (type === "multiple_choice") {
            q.options = [row["Pilihan A"], row["Pilihan B"], row["Pilihan C"], row["Pilihan D"]].map(o => String(o || ""));
            q.correctAnswer = kunci;
          } else if (type === "complex_mc") {
            q.options = [row["Pilihan A"], row["Pilihan B"], row["Pilihan C"], row["Pilihan D"]].map(o => String(o || ""));
            q.correctAnswers = kunci.split("|").map(s => s.trim());
          } else if (type === "true_false") {
            q.trueFalseAnswer = kunci.toLowerCase().includes("benar");
          } else if (type === "multi_true_false") {
            q.statements = extra.split(";").filter(Boolean).map(s => {
              const [text, val] = s.split("|");
              return { text: text.trim(), isTrue: val?.trim().toLowerCase().includes("benar") };
            });
          } else if (type === "matching") {
            q.pairs = extra.split(";").filter(Boolean).map(s => {
              const [left, right] = s.split("|");
              return { left: left?.trim() || "", right: right?.trim() || "" };
            });
          } else if (type === "ordering") {
            q.items = extra.split(";").map(s => s.trim()).filter(Boolean);
          } else if (type === "short_answer") {
            q.acceptedAnswers = extra ? extra.split(",").map(s => s.trim()) : [kunci];
          }

          return q;
        });

        resolve(questions.filter((q) => q.question.trim() !== ""));
      } catch {
        reject(new Error("Gagal membaca file Excel."));
      }
    };
    reader.onerror = () => reject(new Error("Gagal membaca file."));
    reader.readAsArrayBuffer(file);
  });
}

// ==========================================
// B9: EXPORT HASIL UJIAN KE EXCEL
// ==========================================

export function exportResultsToExcel(results: ExamResult[], examTitle: string) {
  const dataToExport = results.map((r, i) => ({
    No: i + 1,
    "Nama Siswa": r.studentName,
    Kelas: r.className,
    Nilai: r.score,
    "Jawaban Benar": r.correct,
    "Total Soal": r.total,
    Pelanggaran: r.violations,
    "Waktu Submit": new Date(r.submittedAt).toLocaleString("id-ID"),
  }));

  const ws = XLSX.utils.json_to_sheet(dataToExport);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Hasil Ujian");
  const safeTitle = examTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  XLSX.writeFile(wb, `Hasil_${safeTitle}.xlsx`);
}