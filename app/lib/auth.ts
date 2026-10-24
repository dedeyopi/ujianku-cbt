import { supabase, createTempClient } from "./supabase";

// Baris baru
const toEmail = (username: string) => `${username.trim().toLowerCase()}.ujianku@gmail.com`;

// --- GURU ---
export async function loginTeacher(username: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: toEmail(username),
    password: password,
  });
  
  if (error) return { success: false, message: error.message };
  
  const { data: profile } = await supabase.from("users").select("role").eq("id", data.user.id).single();
  if (profile && profile.role !== "teacher") {
    await supabase.auth.signOut();
    return { success: false, message: "Akun ini bukan akun guru." };
  }
  return { success: true };
}

export async function isLoggedIn() {
  const { data: { user }, error } = await supabase.auth.getUser();
  return !error && !!user;
}

// --- SISWA ---
export async function loginStudent(username: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: toEmail(username),
    password: password,
  });
  
  if (error) return { success: false, message: error.message };
  
  const { data: profile } = await supabase.from("users").select("role").eq("id", data.user.id).single();
  if (profile && profile.role !== "student") {
    await supabase.auth.signOut();
    return { success: false, message: "Akun ini bukan akun siswa." };
  }
  return { success: true };
}

// Buat akun siswa (dipanggil oleh Guru)
export async function createStudentAuth(username: string, password: string, fullName: string, className: string) {
  const tempSupabase = createTempClient(); // Gunakan client sementara
  
  const { data, error } = await tempSupabase.auth.signUp({
    email: toEmail(username),
    password: password,
    options: {
      data: {
        role: "student",
        full_name: fullName,
        class_name: className,
      }
    }
  });

  if (error) return { success: false, message: error.message };
  return { success: true, user: data.user };
}

// --- UMUM ---
export async function logout() {
  await supabase.auth.signOut();
}