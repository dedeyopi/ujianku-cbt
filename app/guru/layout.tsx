"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Menu, Home, BookMarked, FileText, Trophy, PieChart, 
  Database, ShieldCheck, Activity, LogOut, Sun, Maximize, User, Settings
} from "lucide-react";
import { logout } from "../lib/auth";
import { fetchAppSettings } from "../lib/db";
import type { AppSettings } from "../lib/types";

export default function GuruLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center text-white">
        <ShieldCheck className="w-12 h-12 text-blue-500 animate-pulse mb-4" />
        <p className="font-medium text-slate-400">Memuat Panel Guru...</p>
      </div>
    }>
      <GuruLayoutContent>{children}</GuruLayoutContent>
    </Suspense>
  );
}

function GuruLayoutContent({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    async function loadSettings() {
      const data = await fetchAppSettings();
      setSettings(data);
    }
    loadSettings();
  }, []);

  async function handleLogout() {
    await logout();
    router.push("/login-guru");
  }

  const menuItems = [
    { name: "Dashboard", icon: Home, path: "/guru" },
    { name: "Bank Soal", icon: BookMarked, path: "/guru/bank-soal" },
    { name: "Ujian", icon: FileText, path: "/guru/ujian" },
    { name: "Hasil Ujian", icon: Trophy, path: "/guru/hasil" },
    { name: "Analisis Soal", icon: PieChart, path: "/guru/hasil" },
  ];

  const adminItems = [
    { name: "Data Siswa", icon: Database, path: "/guru/siswa" },
    { name: "Live Monitor", icon: Activity, path: "/guru/pantau" },
    { name: "Pengaturan", icon: Settings, path: "/guru/pengaturan" },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0f172a] text-slate-300 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} flex flex-col`}>
        <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-[#0f172a]">
          <div className="flex items-center gap-3">
            {settings?.schoolLogoUrl ? (
              <img src={settings.schoolLogoUrl} alt="Logo" className="w-8 h-8 object-contain" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
            )}
            <span className="text-lg font-black text-white tracking-tight truncate">
              {settings?.schoolName || "UjianKu"}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
          <div>
            <p className="px-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Menu</p>
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <Link key={item.name} href={item.path} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${isActive ? "bg-blue-600 text-white" : "hover:bg-slate-800 hover:text-white"}`}>
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div>
            <p className="px-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Administrasi</p>
            <nav className="space-y-1">
              {adminItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <Link key={item.name} href={item.path} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${isActive ? "bg-blue-600 text-white" : "hover:bg-slate-800 hover:text-white"}`}>
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors">
            <LogOut className="w-5 h-5" /> Keluar
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
              <Menu className="w-6 h-6" />
            </button>
            {/* Nama Sekolah di Header */}
            <h2 className="text-lg font-bold text-slate-800 hidden sm:block uppercase tracking-wide">
              {settings?.schoolName || "APLIKASI CBT"}
            </h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg hidden sm:block"><Sun className="w-5 h-5" /></button>
            <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg hidden sm:block"><Maximize className="w-5 h-5" /></button>
            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
            <div className="flex items-center gap-3 pl-2">
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                <User className="w-5 h-5" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-bold text-slate-800 leading-tight">Guru Admin</p>
                <p className="text-xs text-slate-500 leading-tight">Pengelola Ujian</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}