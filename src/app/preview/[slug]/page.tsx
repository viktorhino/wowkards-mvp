import "server-only";
import Link from "next/link";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { buildCongratsPreviewMsg } from "@/lib/whatsapp";

type SP = Record<string, string | string[] | undefined>;

export default async function PreviewPage(props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SP>;
}) {
  // NEXT 15: params y searchParams son Promises
  const { slug } = await props.params;
  const sp = await props.searchParams;

  const token = typeof sp.edit === "string" ? sp.edit : undefined;
  const code = typeof sp.code === "string" ? sp.code : undefined;

  // ✅ Instanciamos Supabase directamente (anon key) en el server component
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createSupabaseClient(supabaseUrl, supabaseAnon, {
    auth: { persistSession: false },
  });

  const { data: prof, error } = await supabase
    .from("profiles")
    .select(
      "name,last_name,whatsapp,email,template_config,mini_bio,position, company,slug,avatar_url"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error || !prof) {
    return (
      <main className="max-w-5xl mx-auto p-6">No se encontró el perfil.</main>
    );
  }

  const fullName = `${prof.name ?? ""} ${prof.last_name ?? ""}`.trim();

  // Avatar con fallback legacy (sin 'any')
  type TCfgAvatar = {
    avatar_url?: string;
    photoUrl?: string;
    photo_url?: string;
    photoDataUrl?: string;
  };
  const cfgAvatar = (prof.template_config ?? {}) as TCfgAvatar;

  const legacyAvatar =
    cfgAvatar.avatar_url ||
    cfgAvatar.photoUrl ||
    cfgAvatar.photo_url ||
    cfgAvatar.photoDataUrl;

  const avatar =
    prof.avatar_url || legacyAvatar || "/defaults/avatar-placeholder.png";

  // WhatsApp + enlaces
  const wa = (prof.whatsapp || "").replace(/\D/g, "");

  const base =
    process.env.NEXT_PUBLIC_PUBLIC_BASE_URL || // prod: https://mi.wowkard.es
    process.env.NEXT_PUBLIC_BASE_URL || // fallback (dev): http://localhost:3000
    "";

  const publicUrl = `${base}/${slug}`;
  const editUrl = token ? `${base}/edit/${token}` : undefined;

  // Si quieres “solo nombre” sin apellido en el saludo:
  const firstName = (prof.name || "").trim();

  const waText = buildCongratsPreviewMsg({
    fullName: firstName || fullName,
    publicUrl,
    editUrl,
  });

  const waHref = wa
    ? `https://wa.me/${wa}?text=${encodeURIComponent(waText)}`
    : undefined;

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header con avatar */}
      <div className="rounded-3xl bg-white/90 p-6 shadow">
        <div className="flex flex-col items-center gap-4">
          <div className="w-28 h-28 rounded-full ring-4 ring-white overflow-hidden bg-white shadow">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatar}
              alt={fullName || "Avatar"}
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-3xl font-bold">Revisa tus datos</h1>
          {token && (
            <Link
              href={`/edit/${token}`}
              className="rounded-full px-4 py-2 text-sm font-semibold bg-gray-200"
              title="Editar (cambiar foto y demás)"
            >
              Cambiar foto / Editar
            </Link>
          )}
        </div>
      </div>

      {/* Grid de datos */}
      <section className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl bg-gray-50 p-4">
          <div className="text-sm text-gray-500">Nombre</div>
          <div className="font-medium">{fullName || "—"}</div>
          <div className="rounded-xl bg-gray-50 p-4">
            <div className="text-sm text-gray-500">Cargo</div>
            <div className="font-medium">{prof.position || "—"}</div>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <div className="text-sm text-gray-500">Empresa</div>
            <div className="font-medium">{prof.company || "—"}</div>
          </div>
        </div>
        <div className="rounded-xl bg-gray-50 p-4">
          <div className="text-sm text-gray-500">Email</div>
          <div className="font-medium">{prof.email || "—"}</div>
        </div>
        <div className="rounded-xl bg-gray-50 p-4">
          <div className="text-sm text-gray-500">WhatsApp</div>
          <div className="font-medium">{prof.whatsapp || "—"}</div>
        </div>
        <div className="rounded-xl bg-gray-50 p-4">
          <div className="text-sm text-gray-500">URL pública</div>
          <div className="font-medium">/{slug}</div>
        </div>
        <div className="rounded-xl bg-gray-50 p-4">
          <div className="text-sm text-gray-500">Diseño</div>
          <div className="font-medium">
            {prof.template_config?.layout ?? "cardA"}
          </div>
        </div>
        <div className="rounded-xl bg-gray-50 p-4">
          <div className="text-sm text-gray-500">Colores</div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{
                  background: prof.template_config?.brand?.primary ?? "#0A66FF",
                }}
              />
              <code>{prof.template_config?.brand?.primary ?? "#0A66FF"}</code>
            </span>
            <span className="inline-flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{
                  background: prof.template_config?.brand?.accent ?? "#4FB0FF",
                }}
              />
              <code>{prof.template_config?.brand?.accent ?? "#4FB0FF"}</code>
            </span>
          </div>
        </div>
      </section>

      {/* Mini bio */}
      <section className="rounded-xl bg-gray-50 p-4">
        <div className="text-sm text-gray-500">Mini bio</div>
        <div className="font-medium">{prof.mini_bio || "—"}</div>
      </section>

      {/* CTAs */}
      <div className="flex flex-col md:flex-row gap-3 md:gap-4 pt-2">
        <Link
          href={token ? `/edit/${token}` : code ? `/${code}` : "/"}
          className="flex-1 rounded-full bg-[#ffe59f] text-black py-3 font-semibold text-center"
        >
          Regresar y corregir datos
        </Link>
        {waHref && (
          <a
            href={waHref}
            className="flex-1 rounded-full bg-green-500 text-white py-3 font-semibold shadow-[inset_0_-2px_0_rgba(0,0,0,.18)] text-center"
            target="_blank"
            rel="noopener noreferrer"
          >
            Enviar WhatsApp
          </a>
        )}

        <Link
          href={`/${slug}`}
          className="flex-1 rounded-full bg-[#FFC62E] text-black py-3 font-semibold shadow-[inset_0_-2px_0_rgba(0,0,0,.18)] text-center"
        >
          Confirmar y ver tarjeta
        </Link>
      </div>
    </main>
  );
}
