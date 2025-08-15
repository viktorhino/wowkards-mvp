/* Página pública: obtiene perfil (incluye avatar_url) y renderiza template */
import { createClient } from "@/lib/supabase/server";
import { templateRegistry, TemplateKey } from "@/templates/registry";
import type { PublicProfile } from "@/templates/types";
import { supabaseAdmin } from "@/lib/supabase/server";

export default async function PublicCard({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  console.log("Slug recibido:", slug);

  const supabase = supabaseAdmin();

  const { data, error } = await supabase
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

  console.log("Resultado Supabase:", data, error);

  if (!data || error) {
    return (
      <main className="max-w-5xl mx-auto p-6">No se encontró la WOWKard.</main>
    );
  }

  const key: TemplateKey = "TemplateLinkBio";
  const mod = await templateRegistry[key]();
  const Component = mod.default as React.ComponentType<{
    profile: PublicProfile;
  }>;

  return (
    <main
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "linear-gradient(180deg,#ffcf3b,#ffb300)" }}
    >
      <Component profile={data as PublicProfile} />
    </main>
  );
}
