import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server"; // ya lo tienes para /api/claim

export async function POST(req: Request) {
  try {
    const { slug, avatar_url, header_url, cover_url } = await req.json();
    if (!slug)
      return NextResponse.json(
        { ok: false, error: "Missing slug" },
        { status: 400 }
      );

    const admin = supabaseAdmin();

    // Merge de template_config (simple: toma lo existente y sobreescribe keys)
    const { data: current } = await admin
      .from("profiles")
      .select("template_config")
      .eq("slug", slug)
      .maybeSingle();

    const template_config = {
      ...(current?.template_config ?? {}),
      avatar_url: avatar_url ?? current?.template_config?.avatar_url ?? null,
      header_url: header_url ?? current?.template_config?.header_url ?? null,
      cover_url: cover_url ?? current?.template_config?.cover_url ?? null,
    };

    const { error } = await admin
      .from("profiles")
      .update({ template_config })
      .eq("slug", slug);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, error: e.message ?? "update error" },
      { status: 500 }
    );
  }
}
