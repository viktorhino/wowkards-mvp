// src/app/[path]/page.tsx
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
// Usa el client público (seguro en server) que ya creaste:
import { supabase } from "@/lib/supabaseClient";
import ClaimForm from "./ClaimForm";

type Params = { path: string };

export default async function Page({ params }: { params: Promise<Params> }) {
  // 👇 Next 15: params puede ser una Promise; hay que await
  const { path } = await params;
  const slugOrCode = decodeURIComponent(path);

  // 1) ¿coincide con un slug de perfil?
  const { data: prof, error: profErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("slug", slugOrCode)
    .maybeSingle();

  if (profErr) {
    return (
      <div className="p-6">
        Error cargando perfil: {String(profErr.message || profErr)}
      </div>
    );
  }

  if (prof) {
    // Carga perezosa de la plantilla LinkBio
    const mod = await import("@/templates/TemplateLinkBio/component");
    const Mod = (mod as any).default as React.FC<any>;
    return <Mod profile={prof} />;
  }

  // 2) ¿coincide con un short code?
  const { data: sc, error: scErr } = await supabase
    .from("short_codes")
    .select("*")
    .eq("code", slugOrCode)
    .maybeSingle();

  if (scErr) {
    return (
      <div className="p-6">
        Error cargando código: {String(scErr.message || scErr)}
      </div>
    );
  }

  if (sc) {
    if (sc.status === "unclaimed") {
      return <ClaimForm code={sc.code} />;
    }
    if (sc.external_url) {
      redirect(sc.external_url);
    }
    if (sc.slug) {
      redirect(`/${sc.slug}`);
    }
    return (
      <div className="p-6">
        Código <b>{sc.code}</b> en estado <b>{sc.status}</b> pero sin destino
        configurado.
      </div>
    );
  }

  // 3) 404 sencillo
  return <div className="p-6">No encontrado: {slugOrCode}</div>;
}
