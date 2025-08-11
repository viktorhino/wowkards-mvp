// src/app/[path]/page.tsx
import { supabase } from "@/lib/supabase/client";
import { templateRegistry } from "@/templates/registry";
import { redirect } from "next/navigation";
import ClaimForm from "@/app/(claim)/components/ClaimForm";

// evita cache agresivo para esta ruta dinámica
export const dynamic = "force-dynamic";

type Params = { path: string };

export default async function Page(props: { params: Promise<Params> }) {
  // Next 15: params es Promise => hay que await
  const { path } = await props.params;
  const decoded = decodeURIComponent(path);

  // 1) ¿Es slug de perfil?
  const { data: prof } = await supabase
    .from("profiles")
    .select("*")
    .eq("slug", decoded)
    .maybeSingle();

  if (prof) {
    // carga del template según profile.template_key
    const loader =
      templateRegistry[prof.template_key as keyof typeof templateRegistry];
    // tipado laxo para no pelear con props específicas en el MVP
    const Mod = (await loader()).default as any;
    return <Mod profile={prof} />;
  }

  // 2) ¿Es short code?
  const { data: sc } = await supabase
    .from("short_codes")
    .select("*")
    .eq("code", decoded)
    .maybeSingle();

  if (sc) {
    if (sc.status === "unclaimed") {
      return <ClaimForm code={sc.code} />;
    }
    if (sc.external_url) redirect(sc.external_url);
    if (sc.slug) redirect(`/${sc.slug}`);
  }

  // 3) 404 simple
  return <div className="p-8">No encontrado.</div>;
}
