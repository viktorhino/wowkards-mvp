// src/app/api/profile/by-token/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token") || "";
    if (!token)
      return NextResponse.json(
        { ok: false, error: "Missing token" },
        { status: 400 }
      );

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "name,last_name,whatsapp,mini_bio,position, company,email,slug,template_config,edit_token"
      )
      .eq("edit_token", token)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { ok: false, error: "Token inválido o expirado" },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, profile: data });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
