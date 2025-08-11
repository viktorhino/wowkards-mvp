export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

type Params = { slug: string };
type Search = { searchParams?: { [k: string]: string | string[] | undefined } };

const digits = (s: string | null | undefined) => (s || "").replace(/\D/g, "");

const toE164Digits = (raw: string | null | undefined, defaultCc = "57") => {
  const d = digits(raw);
  if (!d) return null;
  // si ya viene con CC (11+ dígitos), lo dejamos; si parecen 10 dígitos, anteponemos CC
  if (d.length >= 11) return d;
  if (d.length === 10) return defaultCc + d;
  return d; // fallback
};

const buildWhatsAppShare = (profileUrl: string, editUrl?: string) => {
  const lines = [
    "¡Esta es tu WOWKard! 🎉",
    profileUrl,
    editUrl ? "\nPara editarla más tarde:" : "",
    editUrl || "",
  ].filter(Boolean);
  const text = encodeURIComponent(lines.join("\n"));
  return `https://wa.me/?text=${text}`;
};

export default async function Page(
  props: { params: Promise<Params> } & Search
) {
  const { slug } = await props.params;
  const editToken =
    typeof props.searchParams?.edit === "string"
      ? props.searchParams!.edit
      : undefined;

  // Trae el perfil
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !profile) {
    return <div className="p-6">No se pudo cargar el perfil.</div>;
  }

  const profileUrl = `${process.env.NEXT_PUBLIC_BASE_URL || ""}/${slug}`
    .replace(/\/+$/, "")
    .replace(/([^:]\/)\/+/g, "$1");
  const editUrl = editToken
    ? `${process.env.NEXT_PUBLIC_BASE_URL || ""}/edit/${editToken}`
    : undefined;

  // mensaje
  const lines = [
    "¡Esta es tu WOWKard!",
    profileUrl,
    editUrl ? "\nPara editarla más tarde:" : "",
    editUrl || "",
  ].filter(Boolean);
  const text = encodeURIComponent(lines.join("\n"));

  // número del perfil
  const phoneDigits = toE164Digits(profile.whatsapp, "57");

  // link final (si hay número -> chat directo; si no -> share genérico)
  const waHref = phoneDigits
    ? `https://wa.me/${phoneDigits}?text=${text}`
    : `https://wa.me/?text=${text}`;

  const waShare = buildWhatsAppShare(profileUrl, editUrl);

  // Carga perezosa de la plantilla
  const mod = await import("@/templates/TemplateLinkBio/component");
  const Template = (mod as any).default as React.FC<any>;

  return (
    <main className="min-h-screen flex flex-col items-center p-6 gap-4">
      <Template profile={profile} />
      <div className="w-full max-w-md flex flex-col gap-2 mt-2">
        <a
          className="rounded-lg border p-3 text-center hover:bg-gray-50"
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
        >
          {phoneDigits ? "Enviar a su WhatsApp" : "Compartir por WhatsApp"}
        </a>
        {editToken && (
          <Link
            className="rounded-lg border p-3 text-center hover:bg-gray-50"
            href={`/edit/${editToken}`}
          >
            Editar mis datos
          </Link>
        )}
        <a
          className="rounded-lg border p-3 text-center hover:bg-gray-50"
          href={`/${slug}`}
          target="_blank"
        >
          Ver URL pública
        </a>
      </div>
    </main>
  );
}
