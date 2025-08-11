import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

export async function GET(req: NextRequest) {
  const email =
    req.nextUrl.searchParams.get("email")?.trim().toLowerCase() ?? "";
  if (!email) return NextResponse.json({ ok: false, taken: false });

  // cuenta (sin devolver filas)
  const { count, error } = await supabase
    .from("profiles")
    .select("*", { head: true, count: "exact" })
    .eq("email", email);

  return NextResponse.json({ ok: !error, taken: (count ?? 0) > 0 });
}
