/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
export const dynamic = "force-dynamic";

// @ts-ignore
import { supabase } from "@/lib/supabase/client";
import ClaimForm from "./ClaimForm";
import { redirect } from "next/navigation";

export default async function Page({ params }: { params: { path: string } }) {
  const path = decodeURIComponent(params.path);

  // 1) ¿Es un slug de perfil?
  const { data: prof } = await supabase
    .from("profiles")
    .select("*")
    .eq("slug", path)
    .maybeSingle();

  if (prof) {
    const mod = await import("@/templates/TemplateLinkBio/component");
    const Mod = mod.default as React.FC<any>;
    return <Mod profile={prof} />;
  }

  // 2) ¿Es un short code?
  const { data: sc } = await supabase
    .from("short_codes")
    .select("*")
    .eq("code", path)
    .maybeSingle();

  if (sc) {
    if (sc.status === "unclaimed") return <ClaimForm code={sc.code} />;
    if (sc.external_url) redirect(sc.external_url);
    if (sc.slug) redirect(`/${sc.slug}`);
    return (
      <div className="p-6">
        Código <b>{sc.code}</b> en estado <b>{sc.status}</b> pero sin destino
        configurado.
      </div>
    );
  }

  // 3) 404
  return <div className="p-6">No encontrado: {path}</div>;
}
