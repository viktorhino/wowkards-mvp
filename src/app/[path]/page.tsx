/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-ignore
// Fuerza a que esta ruta sea dinámica (sin prerender en build)
export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase/client";
import { templateRegistry, TemplateKey } from "@/templates/registry";
import { redirect } from "next/navigation";
import ClaimForm from "./ClaimForm";

// @ts-ignore
export default async function Page({ params }: any) {
  const path = decodeURIComponent(params.path);

  // 1) Buscar por slug
  const { data: prof } = await supabase
    .from("profiles")
    .select("*")
    .eq("slug", path)
    .maybeSingle();

  if (prof) {
    const loader = templateRegistry[prof.template_key as TemplateKey];
    // @ts-ignore
    const Mod = (await loader()).default as React.FC<any>;
    return <Mod profile={prof} />;
  }

  // 2) Buscar por short_code
  const { data: sc } = await supabase
    .from("short_codes")
    .select("*")
    .eq("code", path)
    .maybeSingle();

  if (sc) {
    if (sc.status === "unclaimed") {
      return <ClaimForm code={sc.code} />;
    }
    if (sc.external_url) redirect(sc.external_url);
    if (sc.slug) redirect(`/${sc.slug}`);
  }

  // 3) Si no se encuentra
  return <div className="p-8">No encontrado.</div>;
}
