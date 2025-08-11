"use client";
import * as React from "react";

type ExtraItem = { type: string; value: string };

type Profile = {
  name: string;
  last_name: string;
  mini_bio?: string | null;
  slug: string;
  whatsapp?: string | null;
  email?: string | null;
  template_config?: {
    avatar_url?: string | null;
    extra?: ExtraItem[];
  } | null;
};

function cx(...c: (string | false | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

/* ================= Icons (SVG inline, blancos) ================= */
const IconMail = (p: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M2 6.5A2.5 2.5 0 0 1 4.5 4h15A2.5 2.5 0 0 1 22 6.5v11A2.5 2.5 0 0 1 19.5 20h-15A2.5 2.5 0 0 1 2 17.5v-11Zm2.2-.5 7.8 5.2L19.8 6H4.2Zm15.3 2.1-8.1 5.4a1 1 0 0 1-1.1 0L2.2 8.1V17.5c0 .55.45 1 1 1h17.6c.55 0 1-.45 1-1V8.1Z" />
  </svg>
);
const IconWeb = (p: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM4.7 8h4.1a16 16 0 0 0-.8 4H4.2A7.9 7.9 0 0 1 4.7 8Zm.6 6h3.7c.2 1.4.6 2.7 1.2 3.8A8 8 0 0 1 5.3 14Zm9.8 3.8c.6-1.1 1-2.4 1.2-3.8h3.7a8 8 0 0 1-4.9 3.8ZM18.8 12h-3.7a13 13 0 0 0-.8-4h4.1c.5 1.2.8 2.6.9 4ZM9.5 12c.2-1.5.7-3 1.5-4.2.8 1.2 1.3 2.7 1.5 4.2h-3Zm3 2c-.2 1.5-.7 3-1.5 4.2A8.4 8.4 0 0 1 9.5 14h3Z" />
  </svg>
);
const IconPhone = (p: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M6.6 2h10.8C19 2 20 3 20 4.6v14.8c0 1.6-1 2.6-2.6 2.6H6.6C5 22 4 21 4 19.4V4.6C4 3 5 2 6.6 2Zm0 2C6.2 4 6 4.2 6 4.6v14.8c0 .4.2.6.6.6h10.8c.4 0 .6-.2.6-.6V4.6c0-.4-.2-.6-.6-.6H6.6ZM8 6h8v2H8V6Zm4 12c-.8 0-1.4-.6-1.4-1.4 0-.7.6-1.3 1.4-1.3.7 0 1.3.6 1.3 1.3 0 .8-.6 1.4-1.3 1.4Z" />
  </svg>
);
const IconInstagram = (p: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Zm0 2a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm5.3-.9a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0Z" />
  </svg>
);
const IconFacebook = (p: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M13 10h3l-.4 3H13v9h-3v-9H8v-3h2V8.2C10 6 11.1 5 13.6 5H16v3h-1.8c-1 0-1.2.4-1.2 1.2V10Z" />
  </svg>
);
const IconTiktok = (p: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M14 3h3c.3 2.5 1.8 4 4 4v3c-1.7 0-3.3-.6-4.6-1.7V15a6 6 0 1 1-6-6c.5 0 1 .1 1.6.2V12a3 3 0 1 0 2.4 2.9V3Z" />
  </svg>
);
const IconX = (p: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M4 4h4.7l4 5.6L17.8 4H20l-6.5 8.8L20 20h-4.7l-4.2-5.8L6.2 20H4l6.6-8.9L4 4Z" />
  </svg>
);
const IconMap = (p: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M12 2a7 7 0 0 0-7 7c0 5.3 7 13 7 13s7-7.7 7-13a7 7 0 0 0-7-7Zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z" />
  </svg>
);

/* ================= Helpers ================= */
const toDigits = (s?: string | null) => (s || "").replace(/\D/g, "");
const toE164 = (raw?: string | null, cc = "57") => {
  const d = toDigits(raw);
  if (!d) return null;
  if (d.length >= 11) return `+${d}`;
  if (d.length === 10) return `+${cc}${d}`;
  return `+${d}`;
};

function extraToAction(extra: ExtraItem) {
  const v = extra.value.trim();
  switch (extra.type) {
    case "direccion":
      return {
        key: "maps",
        label: "Dirección",
        href: `https://maps.google.com/?q=${encodeURIComponent(v)}`,
        Icon: IconMap,
      };
    case "facebook":
      return {
        key: "facebook",
        label: "Facebook",
        href: v.startsWith("http") ? v : `https://facebook.com/${v}`,
        Icon: IconFacebook,
      };
    case "instagram":
      return {
        key: "instagram",
        label: "Instagram",
        href: v.startsWith("http")
          ? v
          : `https://instagram.com/${v.replace(/^@/, "")}`,
        Icon: IconInstagram,
      };
    case "tiktok":
      return {
        key: "tiktok",
        label: "TikTok",
        href: v.startsWith("http")
          ? v
          : `https://www.tiktok.com/@${v.replace(/^@/, "")}`,
        Icon: IconTiktok,
      };
    case "x":
      return {
        key: "x",
        label: "X",
        href: v.startsWith("http") ? v : `https://x.com/${v.replace(/^@/, "")}`,
        Icon: IconX,
      };
    case "otro":
      return {
        key: "link",
        label: "Link",
        href: v.startsWith("http") ? v : `https://${v}`,
        Icon: IconWeb,
      };
    default:
      return null;
  }
}

/* ================= Colores de marca ================= */
const BRAND_BG: Record<string, string> = {
  email: "#0A84FF", // iOS blue
  phone: "#34C759", // iOS green
  website: "#A1A1AA", // neutral
  facebook: "#1877F2",
  instagram: "instagram", // hacemos gradiente especial
  tiktok: "#000000",
  x: "#000000",
  maps: "#4285F4",
  link: "#6B7280",
};

const BrandBg = ({ brand }: { brand: string }) => {
  if (brand === "instagram") {
    // gradiente estilo Instagram
    return (
      <div
        className="absolute inset-0 rounded-xl"
        style={{
          background:
            "linear-gradient(45deg,#F58529,#FEDA77 40%,#DD2A7B 60%,#8134AF 80%,#515BD4)",
        }}
      />
    );
  }
  return (
    <div
      className="absolute inset-0 rounded-xl"
      style={{ background: BRAND_BG[brand] || "#111827" }}
    />
  );
};

export default function TemplateLinkBio({ profile }: { profile: Profile }) {
  const avatar = profile.template_config?.avatar_url || "/defaults/avatar.png";
  const fullName =
    `${profile.name ?? ""} ${profile.last_name ?? ""}`.trim() || profile.slug;

  // Acciones base (con key para color)
  const phoneDigits = toE164(profile.whatsapp);
  const baseActions = [
    profile.email
      ? {
          key: "email",
          label: "Email",
          href: `mailto:${profile.email}`,
          Icon: IconMail,
        }
      : null,
    {
      key: "website",
      label: "Website",
      href: `/${profile.slug}`,
      Icon: IconWeb,
    },
    phoneDigits
      ? {
          key: "phone",
          label: "Phone",
          href: `tel:${phoneDigits}`,
          Icon: IconPhone,
        }
      : null,
  ].filter(Boolean) as {
    key: string;
    label: string;
    href: string;
    Icon: any;
  }[];

  // Extras
  const extras = (profile.template_config?.extra || [])
    .map(extraToAction)
    .filter(Boolean) as {
    key: string;
    label: string;
    href: string;
    Icon: any;
  }[];

  const actions = [...baseActions, ...extras];

  return (
    <div className="w-full flex justify-center">
      <div
        className={cx(
          "relative w-[360px] max-w-full rounded-[28px] overflow-hidden shadow-xl",
          "bg-white"
        )}
      >
        {/* HEADER con avatar grande que se degrada hacia abajo */}
        <div className="relative h-56 w-full">
          {/* Imagen ocupa todo el header */}
          <img
            src={avatar}
            alt={fullName}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                "/defaults/avatar.png";
            }}
            style={{
              // Máscara: la parte baja se va volviendo transparente → se funde con el fondo blanco
              WebkitMaskImage:
                "linear-gradient(to bottom, rgba(0,0,0,1) 55%, rgba(0,0,0,0.85) 72%, rgba(0,0,0,0.4) 88%, rgba(0,0,0,0) 100%)",
              maskImage:
                "linear-gradient(to bottom, rgba(0,0,0,1) 55%, rgba(0,0,0,0.85) 72%, rgba(0,0,0,0.4) 88%, rgba(0,0,0,0) 100%)",
            }}
          />
          {/* Sombra sutil superior */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-transparent" />
        </div>

        {/* CONTENIDO */}
        <div className="px-6 -mt-4 pb-6">
          <div className="text-center">
            <h1 className="text-[22px] font-semibold tracking-tight">
              {fullName}
            </h1>
            <p className="text-sm text-neutral-600 mt-1">Emprendedor</p>
            {profile.mini_bio ? (
              <p className="text-sm text-neutral-700 mt-2">
                {profile.mini_bio}
              </p>
            ) : null}
          </div>

          {/* GRID de botones 3 por fila con color de marca */}
          <div className="grid grid-cols-3 gap-4 mt-5">
            {actions.map(({ key, label, href, Icon }, i) => (
              <a
                key={i}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center"
              >
                <div className="relative w-14 h-14 rounded-xl overflow-hidden shadow-md">
                  <BrandBg brand={key} />
                  <div className="absolute inset-0 grid place-items-center">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                </div>
                <span className="mt-2 text-xs text-neutral-700">{label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
