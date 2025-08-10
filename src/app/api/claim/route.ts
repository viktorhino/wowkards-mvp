import { NextResponse } from "next/server";
import { admin } from "@/lib/supabaseAdmin";

// Helper para responder JSON siempre
const j = (body: any, status = 200) =>
  new NextResponse(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });

export async function POST(req: Request) {
  try {
    // 1) Parseo de body
    let body: any;
    try {
      body = await req.json();
    } catch {
      return j({ ok: false, error: "Body inválido (no es JSON)." }, 400);
    }

    const {
      code,
      name,
      last_name,
      whatsapp,
      email,
      mini_bio,
      slug,
      template_config,
    } = body || {};

    // 2) Validaciones mínimas
    if (!code || !name || !last_name || !slug) {
      return j({ ok: false, error: "Faltan campos requeridos." }, 400);
    }

    // 3) Slug disponible
    {
      const { data: existing, error } = await admin
        .from("profiles")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (error) return j({ ok: false, error: "Error verificando slug." }, 500);
      if (existing)
        return j({ ok: false, error: "El slug ya está ocupado." }, 400);
    }

    // 4) Code existe y está unclaimed
    const { data: sc, error: scErr } = await admin
      .from("short_codes")
      .select("code,status")
      .eq("code", code)
      .maybeSingle();

    if (scErr) return j({ ok: false, error: "Error buscando el código." }, 500);
    if (!sc) return j({ ok: false, error: "Código no existe." }, 404);
    if (sc.status !== "unclaimed") {
      return j({ ok: false, error: "Este código ya fue reclamado." }, 409);
    }

    // 5) Crear perfil
    const { data: profile, error: insErr } = await admin
      .from("profiles")
      .insert({
        name,
        last_name,
        whatsapp: whatsapp ?? null,
        email: email ?? null,
        mini_bio: mini_bio ?? null,
        slug,
        template_key: "TemplateLinkBio",
        template_config: template_config ?? {},
      })
      .select("id")
      .single();

    if (insErr || !profile) {
      return j({ ok: false, error: "Error guardando perfil." }, 500);
    }

    // 6) Marcar el code como reclamado y enlazar slug
    const { error: updErr } = await admin
      .from("short_codes")
      .update({ status: "claimed", slug })
      .eq("code", code);

    if (updErr) {
      // rollback simple: borrar perfil creado si falla la actualización del code
      await admin.from("profiles").delete().eq("id", profile.id);
      return j({ ok: false, error: "Error actualizando el código." }, 500);
    }

    return j({ ok: true, slug }, 200);
  } catch (err: any) {
    // Nunca devolvemos HTML
    return j({ ok: false, error: err?.message || "Error inesperado." }, 500);
  }
}
