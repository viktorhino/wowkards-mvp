import { NextResponse } from "next/server";
import { admin } from "@/lib/supabaseAdmin";

const j = (b: any, s = 200) =>
  new NextResponse(JSON.stringify(b), {
    status: s,
    headers: { "Content-Type": "application/json" },
  });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      edit_token,
      name,
      last_name,
      whatsapp,
      email,
      mini_bio,
      template_config,
    } = body || {};

    if (!edit_token) {
      return j({ ok: false, error: "Falta edit_token" }, 400);
    }

    const patch: Record<string, any> = {};
    if (name !== undefined) patch.name = name;
    if (last_name !== undefined) patch.last_name = last_name;
    if (whatsapp !== undefined) patch.whatsapp = whatsapp;
    if (email !== undefined) patch.email = email;
    if (mini_bio !== undefined) patch.mini_bio = mini_bio;
    if (template_config !== undefined) patch.template_config = template_config;

    const { error } = await admin
      .from("profiles")
      .update(patch)
      .eq("edit_token", edit_token);

    if (error) {
      return j(
        { ok: false, error: error.message || "No se pudo actualizar (DB)." },
        500
      );
    }

    // Buscar el slug para el link de confirmación
    const { data: perfil, error: fetchErr } = await admin
      .from("profiles")
      .select("slug")
      .eq("edit_token", edit_token)
      .single();

    if (fetchErr || !perfil) {
      return j({ ok: true, message: "Guardado" });
    }

    const link = `${
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    }/${perfil.slug}`;

    return j({
      ok: true,
      message: `Guardado. Ver tu WOWKard: ${link}`,
      slug: perfil.slug,
      link,
    });
  } catch (e: any) {
    return j({ ok: false, error: e?.message || "Error" }, 500);
  }
}
