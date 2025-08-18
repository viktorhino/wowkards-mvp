/* Página pública: obtiene perfil (incluye avatar_url) y, si no hay,
   cae a ClaimForm cuando el slug es un código sin reclamar. */

import React from "react";
import { supabaseAdmin } from "@/lib/supabase/server";
import ClaimForm from "@/app/(claim)/components/ClaimForm";
import { registry as templateRegistry } from "@/templates/registry";

import type { PublicProfile, TemplateConfig } from "@/templates/types";

// ---- Tipos de props (tu build espera Promise en params) ----
type PageParams = { slug: string };
type PageProps = { params: Promise<PageParams> };
type TemplateKey = keyof typeof templateRegistry;

// ---- Type guards ----
function isObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object";
}
function isPublicProfile(v: unknown): v is PublicProfile {
  return isObject(v) && typeof (v as any).slug === "string";
}

// ---- Mapeo de layout -> clave del registry ----
const layoutToKey = (cfg?: TemplateConfig): TemplateKey => {
  const layout = (cfg?.layout ?? "cardA").toLowerCase();
  if (layout === "cardb" || layout === "card-b") return "cardB";
  if (layout === "cardc" || layout === "card-c") return "cardC";
  return "cardA";
};

export default async function Page({ params }: PageProps) {
  const { slug } = await params; // en tu setup es Promise<PageParams>

  const supabase = supabaseAdmin();

  // 1) Intentar cargar perfil por slug
  const { data: profileRaw } = await supabase
    .from("profiles")
    .select(
      [
        "slug",
        "name",
        "last_name",
        "position",
        "company",
        "mini_bio",
        "whatsapp",
        "email",
        "avatar_url",
        "template_config",
      ].join(",")
    )
    .eq("slug", slug)
    .maybeSingle();

  const profile: PublicProfile | null = isPublicProfile(profileRaw)
    ? (profileRaw as PublicProfile)
    : null;

  // 2) Si no hay perfil, probar como código sin reclamar
  if (!profile) {
    const { data: sc } = await supabase
      .from("short_codes")
      .select("code, claimed, status")
      .eq("code", slug)
      .maybeSingle();

    const isUnclaimed =
      !!sc &&
      (sc.claimed === false ||
        sc.claimed === null ||
        sc.status === "unclaimed" ||
        sc.status === null);

    if (isUnclaimed) {
      return (
        <main className="min-h-screen">
          <div className="mx-auto max-w-3xl">
            <ClaimForm code={slug} />
          </div>
        </main>
      );
    }

    return (
      <main className="max-w-5xl mx-auto p-6">No se encontró la WOWKard.</main>
    );
  }

  // 3) Perfil encontrado → renderizar template
  const key: TemplateKey = layoutToKey(profile.template_config);

  // El registro puede devolver un módulo ESM (con .default) o el componente directo.
  const entry = await templateRegistry[key]();
  const Component =
    (entry as any).default ??
    (entry as React.ComponentType<{ profile: PublicProfile }>);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <Component profile={profile} />
    </main>
  );
}
