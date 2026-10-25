"use client";

import { useRef, useEffect } from "react";
import { Bold, Italic, Superscript, Subscript } from "lucide-react";

type Props = {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
};

export function TextEditor({ value, onChange, placeholder }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Sinkronisasi nilai awal
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string) => {
    document.execCommand(command, false);
    handleInput(); // Update state setelah format diterapkan
    editorRef.current?.focus();
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white focus-within:ring-2 focus-within:ring-emerald-500/40 focus-within:border-emerald-500 transition">
      {/* Toolbar */}
      <div className="flex items-center gap-1 bg-slate-50 border-b border-slate-200 p-1.5">
        <button
          type="button"
          onClick={() => execCommand("bold")}
          className="p-1.5 text-slate-600 hover:bg-slate-200 rounded"
          title="Tebal"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand("italic")}
          className="p-1.5 text-slate-600 hover:bg-slate-200 rounded"
          title="Miring"
        >
          <Italic className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-slate-300 mx-1"></div>
        <button
          type="button"
          onClick={() => execCommand("superscript")}
          className="p-1.5 text-slate-600 hover:bg-slate-200 rounded font-bold"
          title="Pangkat (x²)"
        >
          <Superscript className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand("subscript")}
          className="p-1.5 text-slate-600 hover:bg-slate-200 rounded font-bold"
          title="Subskrip (x₂)"
        >
          <Subscript className="w-4 h-4" />
        </button>
      </div>

      {/* Area Ketik */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        className="p-3 min-h-[80px] max-h-[300px] overflow-y-auto outline-none text-sm text-slate-900"
        data-placeholder={placeholder}
        style={{
          // Trik CSS agar placeholder muncul saat kosong
          empty: "true",
        }}
      />
      
      {/* CSS untuk placeholder */}
      <style jsx>{`
        div[contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #94a3b8; /* text-slate-400 */
          cursor: text;
        }
      `}</style>
    </div>
  );
}