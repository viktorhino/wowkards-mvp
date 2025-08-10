import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const body = await req.json();
  const { code, name, last_name, whatsapp, email, slug, template_config } =
    body;

  if (!code || !name || !last_name || !slug) {
    return NextResponse.json(
      { ok: false, error: "Missing fields" },
      { status: 400 }
    );
  }

  const admin = supabaseAdmin();

  // 1) Verifica que el code existe y está unclaimed
  const { data: sc, error: e1 } = await admin
    .from("short_codes")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (e1 || !sc || sc.status !== "unclaimed") {
    return NextResponse.json(
      { ok: false, error: "Code invalid or claimed" },
      { status: 400 }
    );
  }

  // 2) Verifica slug libre
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (existing) {
    return NextResponse.json(
      { ok: false, error: "Slug taken" },
      { status: 409 }
    );
  }

  // 3) Crea profile
  // 3) Crea profile
  const { error: e2 } = await admin.from("profiles").insert({
    name,
    last_name,
    whatsapp,
    email,
    slug,
    template_key: "TemplateLinkBio",
    template_config: template_config || {}, // <<<<< guarda extras aquí
  });

  if (e2)
    return NextResponse.json({ ok: false, error: e2.message }, { status: 500 });

  // 4) Actualiza short_code
  const { error: e3 } = await admin
    .from("short_codes")
    .update({ status: "claimed", slug, claimed_at: new Date().toISOString() })
    .eq("code", code);

  if (e3)
    return NextResponse.json({ ok: false, error: e3.message }, { status: 500 });

  return NextResponse.json({ ok: true, slug });
}
