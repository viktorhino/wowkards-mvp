export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { uploadAvatarFromDataUrl } from "@/lib/upload-avatar";

export async function POST(req: Request) {
  try {
    const admin = createAdminClient();
    const body = await req.json();

    // 1) Validación de token
    const token = String(body?.token || body?.edit_token || "").trim();
    if (!token) {
      return NextResponse.json(
        { ok: false, error: "Missing token" },
        { status: 400 }
      );
    }

    // 2) Obtener perfil actual (id/slug)
    const { data: current, error: curErr } = await admin
      .from("profiles")
      .select("id, slug")
      .eq("edit_token", token)
      .single();

    if (curErr || !current) {
      return NextResponse.json(
        { ok: false, error: "Token inválido" },
        { status: 404 }
      );
    }

    // 3) Preparar patch: sacar mini_bio de donde venga y limpiar template_config
    const {
      template_config: tcfgIn,
      photoDataUrl: photoRoot,
      slug: _ignoreSlug, // no permitimos cambiar slug aquí
      token: _ignoreToken, // evitar que se cuele en el UPDATE
      edit_token: _ignoreEdit, // evitar que se cuele en el UPDATE
      bio: bioRoot, // por si alguien envía 'bio' en root
      mini_bio: miniBioRoot, // root correcto
      position: positionRoot,
      company: companyRoot,
      ...patch
    } = body || {};

    // ← extrae posibles valores que aún vengan en template_config (legacy)
    const positionFromTcfg =
      typeof tcfgIn?.position === "string"
        ? tcfgIn.position
        : typeof tcfgIn?.cargo === "string"
        ? tcfgIn.cargo
        : undefined;

    const companyFromTcfg =
      typeof tcfgIn?.company === "string"
        ? tcfgIn.company
        : typeof tcfgIn?.empresa === "string"
        ? tcfgIn.empresa
        : undefined;

    if (positionRoot !== undefined || positionFromTcfg !== undefined) {
      (patch as any).position = (positionRoot ?? positionFromTcfg) || null;
    }
    if (companyRoot !== undefined || companyFromTcfg !== undefined) {
      (patch as any).company = (companyRoot ?? companyFromTcfg) || null;
    }

    // Seguridad extra
    delete (patch as any).token;
    delete (patch as any).edit_token;

    // Acepta legado: bio/mini_bio dentro de template_config
    const bioFromTcfg =
      typeof tcfgIn?.mini_bio === "string"
        ? tcfgIn.mini_bio
        : typeof tcfgIn?.bio === "string"
        ? tcfgIn.bio
        : undefined;

    const mini_bio =
      typeof miniBioRoot === "string"
        ? miniBioRoot
        : typeof bioRoot === "string"
        ? bioRoot
        : bioFromTcfg;

    if (mini_bio !== undefined) {
      (patch as any).mini_bio = mini_bio; // ← siempre en columna root
    }

    // Limpiar template_config de claves indebidas
    const template_config =
      tcfgIn !== undefined
        ? {
            ...tcfgIn,
            bio: undefined,
            mini_bio: undefined,
            photoDataUrl: undefined,
            photo_url: undefined,
            position: undefined,
            cargo: undefined,
            company: undefined,
            empresa: undefined,
          }
        : undefined;

    if (template_config !== undefined) {
      (patch as any).template_config = template_config;
    }

    // 4) UPDATE base (ya sin token/edit_token y con mini_bio correcto)
    const { error: updErr } = await admin
      .from("profiles")
      .update(patch)
      .eq("edit_token", token);

    if (updErr) {
      return NextResponse.json(
        { ok: false, error: updErr.message },
        { status: 400 }
      );
    }

    // 5) Foto (si vino): subir y setear avatar_url (sin bloquear si falla)
    const photoDataUrl: string | null =
      photoRoot || tcfgIn?.photoDataUrl || tcfgIn?.photo_url || null;

    if (photoDataUrl) {
      try {
        const publicUrl = photoDataUrl.startsWith("http")
          ? photoDataUrl
          : await uploadAvatarFromDataUrl(
              photoDataUrl,
              `profiles/${current.id}`
            );
        if (publicUrl) {
          await admin
            .from("profiles")
            .update({ avatar_url: publicUrl })
            .eq("id", current.id);
        }
      } catch {
        /* no bloquear */
      }
    }

    return NextResponse.json({ ok: true, slug: current.slug });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
