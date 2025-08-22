/* Página pública:
   - Si slug tiene exactamente 4 alfanuméricos -> CÓDIGO:
       * Busca en short_codes por code.
       * Si está UNCLAIMED -> muestra ClaimForm.
       * Si está CLAIMED -> REDIRECT a "/<short_codes.slug>" (cambia la URL) y allí se renderiza TemplateLinkBio.
   - Si slug > 4 -> SLUG de perfil:
       * Busca en profiles por slug y renderiza TemplateLinkBio.
*/

import React from "react";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/server";
import ClaimForm from "@/app/(claim)/components/ClaimForm";
import { registry as templateRegistry } from "@/templates/registry";
import type { PublicProfile, TemplateConfig } from "@/templates/types";

type PageParams = { slug: string };
type PageProps = { params: Promise<PageParams> };

// Si en tu proyecto `registry` es export default, cambia a:
//   import templateRegistry from "@/templates/registry"
type TemplateRegistry = typeof templateRegistry;
type TemplateKey = keyof TemplateRegistry;

// --- Helpers ---
function isObject(v: any): v is Record<string, any> {
  return v !== null && typeof v === "object";
}
function isPublicProfile(v: any): v is PublicProfile {
  return isObject(v) && typeof (v as any).slug === "string";
}
// Mapea layout -> clave del registry
const layoutToKey = (cfg?: TemplateConfig): TemplateKey => {
  const raw = String((cfg as any)?.layout ?? "cardA");
  const norm = raw.replace(/[^a-z0-9]/gi, "").toLowerCase();
  if (norm === "cardb") return "cardB" as TemplateKey;
  if (norm === "cardc") return "cardC" as TemplateKey;
  return "cardA" as TemplateKey;
};

export default async function Page({ params }: PageProps) {
  // En tu build, params puede ser Promise -> hay que await
  const { slug } = await params;
  const supabase = supabaseAdmin();

  // 0) ¿Es código corto? (exactamente 4 alfanuméricos)
  const isFourCharCode = /^[a-z0-9]{4}$/i.test(slug);

  if (isFourCharCode) {
    // 1) Tratar como CÓDIGO
    const { data: sc, error: scErr } = await supabase
      .from("short_codes")
      .select("code, claimed, status, slug")
      .eq("code", slug)
      .maybeSingle();

    // Código inexistente
    if (!sc || scErr) {
      redirect("https://mi.sedewow.es/");
    }

    const isUnclaimed =
      sc.claimed === false ||
      sc.claimed === null ||
      sc.status === "unclaimed" ||
      sc.status === null;

    if (isUnclaimed) {
      // Disponible -> formulario de reclamo
      return (
        <main className="min-h-screen">
          <div className="mx-auto max-w-3xl">
            <ClaimForm code={slug} />
          </div>
        </main>
      );
    }

    // 2) Código EXISTE y está CLAIMED -> redirigir a la URL canónica /<slugDelPerfil>
    if (sc.slug) {
      redirect(`/${encodeURIComponent(sc.slug)}`);
    }

    // Si no hay slug asociado, no podemos resolver destino
    //return (
    redirect("https://mi.sedewow.es/");
    //);
  }

  // 3) Tratar como SLUG de perfil (más de 4)
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

  if (!profile) {
    redirect("https://mi.sedewow.es/");
  }

  // Renderizar TemplateLinkBio con el layout del perfil
  const key = layoutToKey(profile.template_config);
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
