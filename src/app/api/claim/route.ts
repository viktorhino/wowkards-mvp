import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { normalizeWhatsapp } from "@/lib/phone";
import { capitalizeWords } from "@/lib/text";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Campos esperados desde el cliente
    const {
      code,
      name,
      last_name,
      whatsapp, // puede venir e164, pero igual lo revalidamos aquí
      email, // ya viene en minúsculas desde el form
      slug,
      template_config, // opcional
    } = body || {};

    // Validación básica
    if (!code || !name || !last_name || !slug) {
      return NextResponse.json(
        { ok: false, error: "Missing fields" },
        { status: 400 }
      );
    }

    // Normaliza y valida WhatsApp en servidor (fuente de verdad)
    const { e164: waE164, valid } = normalizeWhatsapp(String(whatsapp || ""));
    if (!valid) {
      return NextResponse.json(
        { ok: false, error: "WhatsApp inválido" },
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

    // 3) Crea profile (template_config opcional)
    const cfg =
      template_config && typeof template_config === "object"
        ? template_config
        : {};

    const nameCap = capitalizeWords(name);
    const lastCap = capitalizeWords(last_name);

    const { error: e2 } = await admin.from("profiles").insert({
      name: nameCap,
      last_name: lastCap,
      whatsapp: waE164,
      email: email || null,
      slug,
      template_key: "TemplateLinkBio",
      template_config: cfg,
    });

    if (e2) {
      return NextResponse.json(
        { ok: false, error: e2.message },
        { status: 500 }
      );
    }

    // 4) Actualiza short_code
    const { error: e3 } = await admin
      .from("short_codes")
      .update({
        status: "claimed",
        slug,
        claimed_at: new Date().toISOString(),
      })
      .eq("code", code);

    if (e3) {
      return NextResponse.json(
        { ok: false, error: e3.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, slug });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
