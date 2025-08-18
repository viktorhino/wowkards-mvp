/* Claim code → crea perfil, sube avatar y marca short_code como usado */
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin"; // tu helper service-role
import { uploadAvatarFromDataUrl } from "@/lib/upload-avatar";

function normalizeCode(code: string) {
  return String(code || "")
    .trim()
    .toLowerCase();
}
function safe<T>(v: T | undefined, fallback: T | null = null): T | null {
  return v === undefined ? fallback : (v as T);
}

export async function POST(req: Request) {
  try {
    const admin = createAdminClient();
    const body = await req.json();

    // 1) Normaliza inputs y acepta legado (foto dentro de template_config)
    const {
      code,
      slug,
      name,
      last_name,
      position,
      company,

      whatsapp,
      email,
      mini_bio,
      template_config: tcfgIn,
      photoDataUrl: photoRoot,
      ...rest
    } = body || {};

    const codeNorm = normalizeCode(code);
    if (!codeNorm) {
      return NextResponse.json(
        { ok: false, error: "Missing code" },
        { status: 400 }
      );
    }

    const photoDataUrl: string | null =
      photoRoot || tcfgIn?.photoDataUrl || tcfgIn?.photo_url || null;

    // limpiamos template_config de posibles fotos base64/urls legadas
    const template_config = tcfgIn
      ? { ...tcfgIn, photoDataUrl: undefined, photo_url: undefined }
      : null;

    // 2) Valida short_code
    const { data: sc, error: scErr } = await admin
      .from("short_codes")
      .select("code, claimed, status")
      .eq("code", codeNorm)
      .maybeSingle();

    if (scErr || !sc || sc.claimed === true || sc.status === "claimed") {
      return NextResponse.json(
        { ok: false, error: "Code invalid or claimed" },
        { status: 400 }
      );
    }

    // 3) Genera edit_token
    // helper robusto para token (sin any, sin ts-ignore)
    function generateEditToken(): string {
      // En Node 18+ (Vercel) existe crypto.randomUUID; si no, fallback seguro
      const g = globalThis as { crypto?: { randomUUID?: () => string } };
      return g.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
    }

    // 4) Inserta perfil sin avatar_url (lo subimos luego)
    const { data: inserted, error: insErr } = await admin
      .from("profiles")
      .insert({
        slug,
        name,
        last_name,
        position: position ?? null,
        company: company ?? null,
        whatsapp,
        email,
        mini_bio: safe<string>(mini_bio, null),
        template_config: template_config ?? null,
        avatar_url: null,
        edit_token: generateEditToken(),
        ...rest,
      })
      .select("id, slug, edit_token")
      .single();

    if (insErr) {
      return NextResponse.json(
        { ok: false, error: insErr.message },
        { status: 400 }
      );
    }

    // 5) Sube avatar (si viene) y actualiza avatar_url
    // 5) Sube avatar (si viene) y actualiza avatar_url
    try {
      let publicUrl: string | null = null;

      if (typeof photoDataUrl === "string") {
        const s = photoDataUrl.trim(); // ✅ aquí s es string

        if (s.startsWith("http")) {
          // ya viene url pública
          publicUrl = s;
        } else if (s !== "") {
          // es un dataURL base64 -> subir
          publicUrl = await uploadAvatarFromDataUrl(
            s, // ✅ string garantizado
            `profiles/${inserted.id}`
          );
        }
      }

      if (publicUrl) {
        await admin
          .from("profiles")
          .update({ avatar_url: publicUrl })
          .eq("id", inserted.id);
      }
    } catch (e) {
      const err = e as { message?: string };
      console.warn("upload avatar failed:", err?.message ?? e);
      // no bloquea el flujo
    }

    // 6) Marca short_code como usado (status + claimed + claimed_at + slug)
    const { error: updErr } = await admin
      .from("short_codes")
      .update({
        status: "claimed",
        claimed: true,
        claimed_at: new Date().toISOString(),
        slug: inserted.slug,
      })
      .eq("code", codeNorm);

    if (updErr) {
      // No bloqueamos al usuario si esto falla
      return NextResponse.json({
        ok: true,
        slug: inserted.slug,
        edit_token: inserted?.edit_token ?? null,
        warn: updErr.message,
      });
    }

    // 7) OK
    const edit_token =
      (inserted as { edit_token?: string | null })?.edit_token ?? null;

    return NextResponse.json({ ok: true, slug: inserted.slug, edit_token });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
