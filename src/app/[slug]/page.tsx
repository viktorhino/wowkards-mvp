/* Página pública: obtiene perfil (incluye avatar_url) y, si no hay,
   cae a ClaimForm cuando el slug es un código sin reclamar. */

import { supabaseAdmin } from "@/lib/supabase/server";
//import { templateRegistry, TemplateKey } from "@/templates/registry";
//import type { PublicProfile } from "@/templates/types";
import ClaimForm from "@/app/(claim)/components/ClaimForm";

import { templateRegistry } from "@/templates/registry";
import type {
  PublicProfile,
  TemplateKey,
  TemplateConfig,
} from "@/templates/types";

// Mapea el layout guardado en template_config a la clave del registry
const layoutToKey = (cfg?: TemplateConfig): TemplateKey => {
  const layout = (cfg?.layout ?? "cardA").toLowerCase();

  if (layout === "cardb" || layout === "card-b") return "CardB";
  if (layout === "cardc" || layout === "card-c") return "CardC";

  // Por compatibilidad, cardA equivale a la CardA (TemplateLinkBio apunta a CardA)
  return "CardA";
};

export default async function PublicCard({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = await params;

  const supabase = supabaseAdmin();

  // 1) Intentar cargar el perfil público por slug
  const { data: profile, error } = await supabase
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
        // Ojo: si 'website' no existe en tu tabla, NO lo agregues para evitar error
        "avatar_url",
        "template_config",
      ].join(",")
    )
    .eq("slug", slug)
    .maybeSingle();

  // 2) Si NO hay perfil → probar como código sin reclamar
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
      // Render directo del formulario de reclamo
      return (
        <main className="min-h-screen">
          <div className="mx-auto max-w-3xl">
            <ClaimForm code={slug} />
          </div>
        </main>
      );
    }

    // Ni perfil ni código válido
    return (
      <main className="max-w-5xl mx-auto p-6">No se encontró la WOWKard.</main>
    );
  }

  // 3) Perfil encontrado → renderizar template
  /*const key: TemplateKey = "TemplateLinkBio";
  const mod = await templateRegistry[key]();
  const Component = mod.default as React.ComponentType<{
    profile: PublicProfile;
  }>;
  */
  // 3) Perfil encontrado -> renderizar template según template_config.layout
  const key: TemplateKey = layoutToKey(profile.template_config);
  const mod = await templateRegistry[key]();
  const Component = mod.default as React.ComponentType<{
    profile: PublicProfile;
  }>;

  return (
    <main
      className="min-h-screen flex items-center justify-center "
      //style={{ background: "linear-gradient(180deg,#ffcf3b,#ffb300)" }}
    >
      <Component profile={profile as PublicProfile} />
    </main>
  );
}
