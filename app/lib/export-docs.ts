import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun, AlignmentType, ImageRun } from "docx";
import { saveAs } from "file-saver";
import type { Exam } from "./types";

// --- FUNGSI PEMBERSIH TEKS (ANTI-TEKS SAMPAH WORD) ---
function cleanText(html: string | undefined): string {
  if (!html) return "";
  if (typeof window === "undefined") return html; // Fallback untuk SSR

  // Gunakan DOMParser untuk mengambil HANYA teks yang terlihat
  const doc = new DOMParser().parseFromString(html, 'text/html');
  let text = doc.body.textContent || "";

  // Bersihkan sisa-sisa teks aneh dari Word
  text = text.replace(/false false false EN-ID X-NONE AR-SA/gi, '');
  text = text.replace(/Normal 0/gi, '');
  text = text.replace(/mso-[\w-]+:[^;]+;/gi, '');
  text = text.replace(/\/\* Style Definitions \*\/[\s\S]*/gi, ''); // Hapus komentar CSS Word

  return text.trim();
}

// --- FUNGSI MENGUNDUH GAMBAR MENJADI BASE64 ---
async function getBase64ImageFromUrl(imageUrl: string) {
  var res = await fetch(imageUrl);
  var blob = await res.blob();

  return new Promise<string>((resolve, reject) => {
    var reader = new FileReader();
    reader.addEventListener("load", function () {
      resolve(reader.result as string);
    }, false);

    reader.onerror = () => {
      return reject(this);
    };
    reader.readAsDataURL(blob);
  })
}

// ==========================================
// 1. EXPORT KE WORD (.docx)
// ==========================================
export async function exportToWord(exam: Exam) {
  const children: Paragraph[] = [];

  // Header
  children.push(
    new Paragraph({
      text: exam.title,
      heading: "Heading1",
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Mata Pelajaran: ${exam.subject}`, bold: true }),
        new TextRun({ text: ` | Durasi: ${Math.floor(exam.duration / 60)} Menit`, bold: true }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  // Loop Soal
  for (let index = 0; index < exam.questions.length; index++) {
    const q = exam.questions[index];

    // Nomor & Pertanyaan
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${index + 1}. `, bold: true }),
          new TextRun({ text: cleanText(q.question) }),
        ],
        spacing: { before: 200, after: 100 },
      })
    );

    // Gambar Soal (Jika Ada)
    if (q.image) {
      try {
        const base64Img = await getBase64ImageFromUrl(q.image);
        const imgBuffer = await fetch(base64Img).then(res => res.arrayBuffer());
        children.push(
          new Paragraph({
            children: [
              new ImageRun({
                data: imgBuffer,
                transformation: { width: 300, height: 200 }, // Ukuran default di Word
              }),
            ],
            spacing: { after: 100 },
          })
        );
      } catch (e) {
        children.push(new Paragraph({ text: "[Gagal memuat gambar]", spacing: { after: 100 } }));
      }
    }

    // Opsi / Jawaban
    if (q.type === "multiple_choice" || q.type === "complex_mc") {
      q.options?.forEach((opt, i) => {
        children.push(
          new Paragraph({
            text: `${String.fromCharCode(65 + i)}. ${cleanText(opt)}`,
            indent: { left: 400 },
          })
        );
      });
    } else if (q.type === "true_false") {
      children.push(new Paragraph({ text: "A. Benar", indent: { left: 400 } }));
      children.push(new Paragraph({ text: "B. Salah", indent: { left: 400 } }));
    } else if (q.type === "multi_true_false") {
      q.statements?.forEach((st, i) => {
        children.push(
          new Paragraph({
            text: `${i + 1}) ${cleanText(st.text)}  ( Benar / Salah )`,
            indent: { left: 400 },
          })
        );
      });
    } else if (q.type === "matching") {
      children.push(new Paragraph({ text: "Jodohkan pernyataan berikut:", indent: { left: 400 } }));
      q.pairs?.forEach((p, i) => {
        children.push(
          new Paragraph({
            text: `${i + 1}. ${cleanText(p.left)}  -----  ( ... ) ${cleanText(p.right)}`,
            indent: { left: 400 },
          })
        );
      });
    } else if (q.type === "ordering") {
      children.push(new Paragraph({ text: "Urutkan item berikut:", indent: { left: 400 } }));
      q.items?.forEach((item) => {
        children.push(
          new Paragraph({
            text: `(   ) ${cleanText(item)}`,
            indent: { left: 400 },
          })
        );
      });
    } else if (q.type === "short_answer") {
      children.push(new Paragraph({ text: "Jawaban: ............................................................", indent: { left: 400 } }));
    } else if (q.type === "essay") {
      children.push(new Paragraph({ text: "Jawaban:", indent: { left: 400 } }));
      children.push(new Paragraph({ text: "........................................................................................................." }));
      children.push(new Paragraph({ text: "........................................................................................................." }));
      children.push(new Paragraph({ text: "........................................................................................................." }));
    }
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Soal_${exam.title.replace(/[^a-z0-9]/gi, '_')}.docx`);
}

// ==========================================
// 2. EXPORT KE PDF
// ==========================================
export async function exportToPDF(exam: Exam) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const maxLineWidth = pageWidth - margin * 2;

  // Header
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(exam.title, pageWidth / 2, 20, { align: "center" });
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Mata Pelajaran: ${exam.subject} | Durasi: ${Math.floor(exam.duration / 60)} Menit`, pageWidth / 2, 28, { align: "center" });
  
  let yPos = 40;

  // Loop Soal
  for (let index = 0; index < exam.questions.length; index++) {
    const q = exam.questions[index];

    // Cek jika yPos mendekati batas bawah halaman (280)
    if (yPos > 260) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFont("helvetica", "bold");
    const questionText = `${index + 1}. ${cleanText(q.question)}`;
    const splitQuestion = doc.splitTextToSize(questionText, maxLineWidth);
    doc.text(splitQuestion, margin, yPos);
    yPos += splitQuestion.length * 6 + 2;

    // Gambar Soal (Jika Ada)
    if (q.image) {
      try {
        const base64Img = await getBase64ImageFromUrl(q.image);
        // Cek apakah perlu halaman baru untuk gambar
        if (yPos > 200) { doc.addPage(); yPos = 20; }
        
        // Tambahkan gambar (Lebar 80mm, Tinggi otomatis menyesuaikan proporsi atau fix misal 60mm)
        doc.addImage(base64Img, 'JPEG', margin + 5, yPos, 80, 60);
        yPos += 65; // Geser posisi setelah gambar
      } catch (e) {
        doc.setFont("helvetica", "italic");
        doc.text("[Gagal memuat gambar]", margin + 5, yPos);
        doc.setFont("helvetica", "normal");
        yPos += 8;
      }
    }

    doc.setFont("helvetica", "normal");
    
    if (q.type === "multiple_choice" || q.type === "complex_mc") {
      q.options?.forEach((opt, i) => {
        if (yPos > 275) { doc.addPage(); yPos = 20; }
        const optText = `${String.fromCharCode(65 + i)}. ${cleanText(opt)}`;
        const splitOpt = doc.splitTextToSize(optText, maxLineWidth - 10);
        doc.text(splitOpt, margin + 5, yPos);
        yPos += splitOpt.length * 6;
      });
    } else if (q.type === "true_false") {
      doc.text("A. Benar", margin + 5, yPos);
      doc.text("B. Salah", margin + 30, yPos);
      yPos += 6;
    } else if (q.type === "multi_true_false") {
      q.statements?.forEach((st, i) => {
        if (yPos > 275) { doc.addPage(); yPos = 20; }
        const stText = `${i + 1}) ${cleanText(st.text)}  ( Benar / Salah )`;
        const splitSt = doc.splitTextToSize(stText, maxLineWidth - 10);
        doc.text(splitSt, margin + 5, yPos);
        yPos += splitSt.length * 6;
      });
    } else if (q.type === "matching") {
      q.pairs?.forEach((p, i) => {
        if (yPos > 275) { doc.addPage(); yPos = 20; }
        const pairText = `${i + 1}. ${cleanText(p.left)}  -----  ( ... ) ${cleanText(p.right)}`;
        const splitPair = doc.splitTextToSize(pairText, maxLineWidth - 10);
        doc.text(splitPair, margin + 5, yPos);
        yPos += splitPair.length * 6;
      });
    } else if (q.type === "ordering") {
      q.items?.forEach((item) => {
        if (yPos > 275) { doc.addPage(); yPos = 20; }
        doc.text(`(   ) ${cleanText(item)}`, margin + 5, yPos);
        yPos += 6;
      });
    } else if (q.type === "short_answer") {
      doc.text("Jawaban: ....................................................................", margin + 5, yPos);
      yPos += 8;
    } else if (q.type === "essay") {
      doc.text("Jawaban:", margin + 5, yPos);
      yPos += 6;
      doc.text(".........................................................................................................", margin + 5, yPos);
      yPos += 6;
      doc.text(".........................................................................................................", margin + 5, yPos);
      yPos += 6;
      doc.text(".........................................................................................................", margin + 5, yPos);
      yPos += 8;
    }

    yPos += 6; // Jarak antar soal
  }

  doc.save(`Soal_${exam.title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
}