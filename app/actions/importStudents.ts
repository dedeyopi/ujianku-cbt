"use server";

import { supabaseAdmin } from "../lib/supabaseAdmin";

const toEmail = (username: string) => `${username.trim().toLowerCase()}.ujianku@gmail.com`;

export async function bulkImportStudents(students: any[]) {
  const results = { success: 0, failed: 0, errors: [] as string[] };

  // Gunakan Promise.all untuk memproses secara paralel agar cepat
  await Promise.all(
    students.map(async (s) => {
      try {
        // 1. Buat akun di Auth menggunakan Admin API
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: toEmail(s.username),
          password: s.password || "123456", // Default password jika kosong
          email_confirm: true, // Otomatis terkonfirmasi
          user_metadata: {
            role: "student",
            full_name: s.fullName,
            class_name: s.className,
          },
        });

        if (authError) throw authError;
        
        // Trigger SQL akan otomatis membuat profil di tabel public.users
        results.success++;

      } catch (error: any) {
        results.failed++;
        results.errors.push(`Gagal (${s.username}): ${error.message}`);
      }
    })
  );

  return results;
}