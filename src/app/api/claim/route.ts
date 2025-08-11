import { NextResponse } from "next/server";
import { admin } from "@/lib/supabaseAdmin";

const j = (body: any, status = 200) =>
  new NextResponse(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });

export async function POST(req: Request) {
  try {
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

    if (!code || !name || !last_name || !slug) {
      return j({ ok: false, error: "Faltan campos requeridos." }, 400);
    }

    // Slug libre
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

    // Code unclaimed
    const { data: sc, error: scErr } = await admin
      .from("short_codes")
      .select("code,status")
      .eq("code", code)
      .maybeSingle();
    if (scErr) return j({ ok: false, error: "Error buscando el código." }, 500);
    if (!sc) return j({ ok: false, error: "Código no existe." }, 404);
    if (sc.status !== "unclaimed")
      return j({ ok: false, error: "Este código ya fue reclamado." }, 409);

    // Crear perfil (pedimos edit_token en la selección)
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
      .select("id, slug, edit_token")
      .single();

    if (insErr || !profile)
      return j({ ok: false, error: "Error guardando perfil." }, 500);

    // Marcar code como reclamado
    const { error: updErr } = await admin
      .from("short_codes")
      .update({ status: "claimed", slug })
      .eq("code", code);
    if (updErr) {
      await admin.from("profiles").delete().eq("id", profile.id);
      return j({ ok: false, error: "Error actualizando el código." }, 500);
    }

    return j({ ok: true, slug: profile.slug, edit_token: profile.edit_token });
  } catch (err: any) {
    return j({ ok: false, error: err?.message || "Error inesperado." }, 500);
  }
}
