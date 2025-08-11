import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

export async function GET(req: NextRequest) {
  // 1) Buscar el primer short_code con status='unclaimed'
  const { data, error } = await supabase
    .from("short_codes")
    .select("code")
    .eq("status", "unclaimed")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const origin = new URL(req.url).origin;

  // 2) Si no hay códigos libres → fallback amigable
  if (error || !data?.code) {
    return NextResponse.redirect(`${origin}/claim/unavailable`, 302);
  }

  // 3) Redirigir al code libre
  return NextResponse.redirect(`${origin}/${data.code}`, 302);
}
