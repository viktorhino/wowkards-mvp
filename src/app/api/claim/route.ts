import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server"; // ⚠️ es una función factory
import { normalizeWhatsapp } from "@/lib/phone";
import { capitalizeWords } from "@/lib/text";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, name, last_name, whatsapp, email, slug, template_config } =
      body ?? {};

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing code" },
        { status: 400 }
      );
    }
    if (!name || !last_name) {
      return NextResponse.json(
        { ok: false, error: "Missing name fields" },
        { status: 400 }
      );
    }
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing email" },
        { status: 400 }
      );
    }
    if (!slug || typeof slug !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing slug" },
        { status: 400 }
      );
    }
    if (!whatsapp || typeof whatsapp !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing whatsapp" },
        { status: 400 }
      );
    }

    // ✅ crea el cliente admin desde la factory
    const admin = supabaseAdmin();

    // Normalizaciones
    const nameCap = capitalizeWords(String(name));
    const lastCap = capitalizeWords(String(last_name));
    const emailLower = String(email).toLowerCase().trim();
    const waNorm = normalizeWhatsapp(String(whatsapp));
    if (!waNorm.valid) {
      return NextResponse.json(
        { ok: false, error: "Invalid whatsapp" },
        { status: 400 }
      );
    }

    // 1) Verificar code libre
    const { data: codeRow, error: codeErr } = await admin
      .from("short_codes")
      .select("*")
      .eq("code", code)
      .maybeSingle();

    if (codeErr) {
      return NextResponse.json(
        { ok: false, error: codeErr.message },
        { status: 500 }
      );
    }
    if (!codeRow) {
      return NextResponse.json(
        { ok: false, error: "Code invalid" },
        { status: 404 }
      );
    }
    if (codeRow.claimed_at || codeRow.claimed === true) {
      return NextResponse.json(
        { ok: false, error: "Code invalid or claimed" },
        { status: 409 }
      );
    }

    // 2) Verificar slug libre
    const { data: slugRow, error: slugErr } = await admin
      .from("profiles")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (slugErr) {
      return NextResponse.json(
        { ok: false, error: slugErr.message },
        { status: 500 }
      );
    }
    if (slugRow) {
      return NextResponse.json(
        { ok: false, error: "Slug taken" },
        { status: 409 }
      );
    }

    // 3) Crear profile con edit_token
    const edit_token = randomUUID();
    const profilePayload = {
      name: nameCap,
      last_name: lastCap,
      whatsapp: waNorm.e164,
      email: emailLower,
      slug,
      template_config: template_config ?? {},
      edit_token,
      created_via_code: code,
      status: "active",
    };

    const { data: newProfile, error: insErr } = await admin
      .from("profiles")
      .insert(profilePayload)
      .select("id, slug, edit_token")
      .single();

    if (insErr) {
      return NextResponse.json(
        { ok: false, error: insErr.message },
        { status: 500 }
      );
    }

    // 4) Marcar el code como reclamado

    const codeNorm = String(code).trim().toLowerCase(); // por si llega en mayúsculas

    const updatePatch = {
      status: "claimed", // <-- text
      claimed: true, // <-- bool
      claimed_at: new Date().toISOString(),
      slug,
    };

    const { error: updErr } = await admin
      .from("short_codes")
      .update(updatePatch)
      .eq("code", codeNorm);

    if (updErr) {
      // Perfil creado pero fallo marcando el code: no bloquees al usuario
      return NextResponse.json({
        ok: true,
        slug,
        edit_token,
        warn: updErr.message,
      });
    }

    return NextResponse.json({ ok: true, slug, edit_token });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
