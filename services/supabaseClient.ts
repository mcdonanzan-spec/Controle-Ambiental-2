
import { createClient } from '@supabase/supabase-js';

// Tenta pegar do ambiente (Vite/Vercel usam import.meta.env)
// Se não encontrar, use strings vazias ou placeholders para evitar crash imediato,
// mas o app vai pedir login e falhará se não estiver configurado na Vercel.
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
