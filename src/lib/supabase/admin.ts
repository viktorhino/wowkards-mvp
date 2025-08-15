// src/lib/supabase/admin.ts
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !serviceKey) {
  throw new Error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY"
  );
}

// Cliente sólo-servidor con key de servicio (no persistir sesiones)
export function createAdminClient() {
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}
