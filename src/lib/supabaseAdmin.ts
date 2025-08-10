import { createClient } from "@supabase/supabase-js";

/**
 * Cliente ADMIN para el backend (rutas /api, server components).
 * Usa la Service Role Key: NUNCA importes esto en componentes "use client".
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY"
  );
}

// Singleton
export const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

// Por si prefieres estilo función
export const supabaseAdmin = () => admin;
