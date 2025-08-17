export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { uploadAvatarFromDataUrl } from "@/lib/upload-avatar";

/** Tipos de entrada (lo mínimo necesario para tipar sin any) */
type ExtraIn = { kind: string; label?: string; value: string };
type TemplateConfigIn = {
  layout?: "cardA" | "cardB" | "cardC" | string;
  brand?: { primary?: string; accent?: string };
  extras?: ExtraIn[];
} & Record<string, unknown>;

type UpdateBody = {
  token?: string; // también aceptamos edit_token
  edit_token?: string;
  slug?: string; // NO se permite actualizar desde aquí
  photoDataUrl?: string | null;
  name?: string;
  last_name?: string;
  position?: string | null;
  company?: string | null;
  whatsapp?: string;
  email?: string;
  bio?: string | null; // compatibilidad
  mini_bio?: string | null;
  template_config?: TemplateConfigIn;
};

/** Sanitiza el template_config: deja solo las claves permitidas */
function sanitizeTemplateConfig(cfg?: TemplateConfigIn) {
  if (!cfg) return undefined;

  const {
    bio,
    mini_bio,
    photoDataUrl,
    photo_url,
    position,
    cargo,
    company,
    empresa,
    ...rest
  } = cfg;

  const out: {
    layout?: "cardA" | "cardB" | "cardC";
    brand?: { primary?: string; accent?: string };
    extras?: ExtraIn[];
  } = {};

  if (typeof rest.layout === "string") {
    const l = rest.layout.toLowerCase();
    out.layout =
      l === "cardb" || l === "card-b"
        ? "cardB"
        : l === "cardc" || l === "card-c"
        ? "cardC"
        : "cardA";
  }

  if (rest.brand && typeof rest.brand === "object") {
    const b = rest.brand as { primary?: unknown; accent?: unknown };
    out.brand = {
      primary: typeof b.primary === "string" ? b.primary : undefined,
      accent: typeof b.accent === "string" ? b.accent : undefined,
    };
  }

  if (Array.isArray(rest.extras)) {
    out.extras = (rest.extras as ExtraIn[]).map((x) => ({
      kind: String(x.kind),
      label: x.label ? String(x.label) : undefined,
      value: String(x.value),
    }));
  }

  return out;
}

type DBPatch = {
  name?: string;
  last_name?: string;
  position?: string | null;
  company?: string | null;
  mini_bio?: string | null;
  whatsapp?: string;
  email?: string;
  avatar_url?: string | null;
  template_config?: ReturnType<typeof sanitizeTemplateConfig>;
};

export async function POST(req: Request) {
  try {
    const admin = createAdminClient();
    const body = (await req.json()) as UpdateBody;

    // 1) Validación de token
    const token = String(body?.token || body?.edit_token || "").trim();
    if (!token) {
      return NextResponse.json(
        { ok: false, error: "Missing token" },
        { status: 400 }
      );
    }

    // 2) Cargar perfil por edit_token
    const { data: current, error: selError } = await admin
      .from("profiles")
      .select("id, slug")
      .eq("edit_token", token)
      .maybeSingle();

    if (selError) {
      return NextResponse.json(
        { ok: false, error: selError.message || "DB error" },
        { status: 500 }
      );
    }
    if (!current) {
      return NextResponse.json(
        { ok: false, error: "Token not found" },
        { status: 404 }
      );
    }

    // 3) Preparar patch
    const tcfgIn = body.template_config;
    const photoRoot = body.photoDataUrl ?? null;

    const patch: DBPatch = {};
    if (typeof body.name === "string") patch.name = body.name;
    if (typeof body.last_name === "string") patch.last_name = body.last_name;
    if (typeof body.position !== "undefined")
      patch.position = body.position ?? null;
    if (typeof body.company !== "undefined")
      patch.company = body.company ?? null;
    if (typeof body.mini_bio !== "undefined") {
      patch.mini_bio = body.mini_bio;
    } else if (typeof body.bio !== "undefined") {
      patch.mini_bio = body.bio;
    }
    if (typeof body.whatsapp === "string") patch.whatsapp = body.whatsapp;
    if (typeof body.email === "string") patch.email = body.email;

    const template_config = sanitizeTemplateConfig(tcfgIn);
    if (template_config) patch.template_config = template_config;

    // 4) Subir avatar si corresponde
    if (photoRoot) {
      try {
        const publicUrl =
          typeof photoRoot === "string" && photoRoot.startsWith("http")
            ? photoRoot
            : await uploadAvatarFromDataUrl(
                photoRoot,
                `profiles/${current.id}`
              );

        if (publicUrl) {
          patch.avatar_url = publicUrl;
        }
      } catch (e: unknown) {
        // no bloquear el flujo por fallo de upload
        const msg = e instanceof Error ? e.message : String(e);
        console.warn("upload avatar failed:", msg);
      }
    }

    // Si no hay nada que actualizar, responde ok
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ ok: true, slug: current.slug });
    }

    // 5) Actualizar
    const { error: upError } = await admin
      .from("profiles")
      .update(patch)
      .eq("id", current.id);

    if (upError) {
      return NextResponse.json(
        { ok: false, error: upError.message || "DB error" },
        { status: 500 }
      );
    }

    // Éxito
    return NextResponse.json({ ok: true, slug: current.slug });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
