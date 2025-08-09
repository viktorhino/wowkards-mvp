import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug")?.trim().toLowerCase() ?? "";
  if (!slug) {
    return NextResponse.json({ ok: false, available: false });
  }

  // Busca un perfil con ese slug
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    // Si tuvieras RLS mal configurado u otro problema, verías 500 aquí
    return NextResponse.json(
      { ok: false, available: false, error: error.message },
      { status: 500 }
    );
  }

  // available = true cuando NO hay registro (data === null)
  return NextResponse.json({ ok: true, available: !data });
}
