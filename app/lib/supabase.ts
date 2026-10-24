import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client utama (untuk sesi Guru dan Siswa)
export const supabase = createClient(supabaseUrl, supabaseKey);

// Client sementara (khusus Guru saat membuat akun siswa, agar sesi Guru tidak tertimpa)
export const createTempClient = () => {
  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};