"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { getPalette, PublicProfile } from "@/templates/types";

/* Utils -------------------------------------------------------------- */
function cleanPhone(p?: string) {
  return (p || "").replace(/\D/g, "");
}

// Convierte HEX a rgba con alpha
function hexToRgba(hex: string, alpha = 1) {
  const h = hex.replace("#", "");
  const n =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const num = parseInt(n, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Aclara un color HEX mezclándolo con blanco en 'percent'% (0–100)
function lighten(hex: string, percent: number) {
  const h = hex.replace("#", "");
  const num = parseInt(
    h.length === 3
      ? h
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : h,
    16
  );
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  const mix = (c: number) => Math.round(c + (255 - c) * (percent / 100));
  const rr = mix(r).toString(16).padStart(2, "0");
  const gg = mix(g).toString(16).padStart(2, "0");
  const bb = mix(b).toString(16).padStart(2, "0");
  return `#${rr}${gg}${bb}`;
}

// Mapea 'extras.kind' a iconos en /public/icons
function iconFor(kind?: string) {
  const k = (kind || "").toLowerCase();
  switch (k) {
    case "instagram":
      return "/icons/instagram.svg";
    case "facebook":
      return "/icons/facebook.svg";
    case "tiktok":
      return "/icons/tiktok.svg";
    case "x":
      return "/icons/x.svg";
    case "direccion":
      return "/icons/direccion.svg";
    case "email":
      return "/icons/email.svg";
    case "savecontact":
      return "/icons/savecontact.svg";
    case "share":
      return "/icons/share.svg";
    case "whatsapp":
      return "/icons/whatsapp.svg";
    default:
      return "/icons/link.svg";
  }
}

const IconMask = ({ src, color }: { src: string; color: string }) => (
  <span
    style={{
      width: 28,
      height: 28,
      display: "inline-block",
      backgroundColor: color,
      WebkitMaskImage: `url(${src})`,
      maskImage: `url(${src})`,
      WebkitMaskRepeat: "no-repeat",
      maskRepeat: "no-repeat",
      WebkitMaskPosition: "center",
      maskPosition: "center",
      WebkitMaskSize: "contain",
      maskSize: "contain",
    }}
  />
);

// --- Utils de contraste WCAG ---
function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const n =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const num = parseInt(n, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}
function relLuminance({ r, g, b }: { r: number; g: number; b: number }) {
  const f = (c: number) => {
    const cs = c / 255;
    return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
  };
  const R = f(r),
    G = f(g),
    B = f(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}
function contrastRatio(bgHex: string, fgHex: string) {
  const L1 = relLuminance(hexToRgb(bgHex));
  const L2 = relLuminance(hexToRgb(fgHex));
  const [light, dark] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (light + 0.05) / (dark + 0.05);
}

/** Devuelve un color accesible para el icono:
 *  - intenta el preferido
 *  - si no llega a minRatio, prueba blanco
 *  - si no, prueba negro
 *  - si aún así no, devuelve el que más contraste dé
 */
function pickAccessibleIconColor(
  bgHex: string,
  preferHex: string,
  minRatio = 4.5
) {
  const candidates = [preferHex, "#FFFFFF", "#000000"];
  const ratios = candidates.map((c) => ({ c, r: contrastRatio(bgHex, c) }));
  const prefer = ratios[0];
  if (prefer.r >= minRatio) return prefer.c;

  const white = ratios.find((x) => x.c === "#FFFFFF");
  if (white && white.r >= minRatio) return white.c;

  const black = ratios.find((x) => x.c === "#000000");
  if (black && black.r >= minRatio) return black.c;

  return ratios.sort((a, b) => b.r - a.r)[0].c;
}

/* Types para extras -------------------------------------------------- */
type ExtraIn = { kind?: string; label?: string; value?: string };

/* Component ---------------------------------------------------------- */
export default function CardA({ profile }: { profile: PublicProfile }) {
  const { primary, accent: secondary } = getPalette(profile.template_config);

  const full =
    `${profile.name ?? ""} ${profile.last_name ?? ""}`.trim() ||
    "Your Full Name";
  const posCompany = [profile.position, profile.company]
    .filter(Boolean)
    .join(" - ");

  // WhatsApp
  const phone = cleanPhone(profile.whatsapp);
  const waHref = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(
        `Hola ${profile.name}. Me encanta la tarjeta digital de tu Sede WOW!`
      )}`
    : undefined;

  // Extras (sin any, saneados desde unknown)
  const extras: ExtraIn[] = Array.isArray(profile?.template_config?.extras)
    ? (profile.template_config.extras as unknown[])
        .map((x) => {
          if (!x || typeof x !== "object") return undefined;
          const o = x as Record<string, unknown>;
          const kind = typeof o.kind === "string" ? o.kind : undefined;
          const label = typeof o.label === "string" ? o.label : undefined;
          const value = typeof o.value === "string" ? o.value : undefined;
          return { kind, label, value } as ExtraIn;
        })
        .filter((x): x is ExtraIn => !!x)
    : [];

  // CTAs a renderizar (orden: WA → email → extras → website)
  const ctas: Array<{
    key: string;
    label: string;
    href: string;
    icon: string;
  }> = [];

  if (waHref)
    ctas.push({
      key: "wa",
      label: "HABLEMOS!",
      href: waHref,
      icon: "/icons/whatsapp.svg",
    });

  if (profile.email) {
    ctas.push({
      key: "email",
      label: "ESCRÍBEME",
      href: `mailto:${profile.email}`,
      icon: "/icons/email.svg",
    });
  }

  extras.forEach((it) => {
    if (!it || !it.value) return;
    const kind = (it.kind || "").toLowerCase();
    const val = it.value.trim();
    let href = "";
    let label = it.label?.trim();

    switch (kind) {
      case "instagram":
        href = /^https?:\/\//i.test(val) ? val : `https://instagram.com/${val}`;
        label = label || "¡SÍGUENOS!";
        break;
      case "facebook":
        href = /^https?:\/\//i.test(val) ? val : `https://facebook.com/${val}`;
        label = label || "NUESTRO FACEBOOK";
        break;
      case "tiktok":
        href = /^https?:\/\//i.test(val) ? val : `https://tiktok.com/@${val}`;
        label = label || "INSPÍRATE";
        break;
      case "x":
        href = /^https?:\/\//i.test(val) ? val : `https://x.com/${val}`;
        label = label || "SÍGUENOS EN X";
        break;
      case "direccion":
        href = /^https?:\/\//i.test(val)
          ? val
          : `https://maps.google.com/?q=${encodeURIComponent(val)}`;
        label = label || "VISÍTANOS";
        break;
      default:
        if (/^https?:\/\//i.test(val)) href = val;
        else if (/^(\+?\d[\d\s-]+)$/.test(val))
          href = `tel:${val.replace(/\s/g, "")}`;
        else if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val)) href = `mailto:${val}`;
        else
          href = `https://www.google.com/search?q=${encodeURIComponent(val)}`;
        label = label || "Más info";
        break;
    }

    if (href)
      ctas.push({
        key: `extra-${kind}-${val}`,
        label: label!,
        href,
        icon: iconFor(kind),
      });
  });

  if (profile.website) {
    const url = profile.website.startsWith("http")
      ? profile.website
      : `https://${profile.website}`;
    ctas.push({
      key: "web",
      label: "WEBSITE",
      href: url,
      icon: "/icons/link.svg",
    });
  }

  // --------- URL al endpoint /api/vcard (abrirá app de contactos) ---------
  const intlPhone = phone
    ? phone.startsWith("+")
      ? phone
      : `+${phone}`
    : undefined;
  const params = new URLSearchParams();
  params.set("fullName", full);
  if (intlPhone) params.set("phone", intlPhone);
  if (profile.email) params.set("email", profile.email);
  if (profile.company) params.set("org", profile.company);
  if (profile.position) params.set("title", profile.position);
  if (profile.website)
    params.set(
      "url",
      profile.website.startsWith("http")
        ? profile.website
        : `https://${profile.website}`
    );
  if (profile.mini_bio) params.set("note", profile.mini_bio);
  if (profile.avatar_url) params.set("photo", profile.avatar_url);
  const vcardUrl = `/api/vcard?${params.toString()}`;
  // -----------------------------------------------------------------------

  // Colores
  const secondarySafe = secondary || "#000000";
  const floatColor = lighten(primary, 50); // más claro (sin transparencia)

  // Dentro del componente CardA
  async function handleSaveContact(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();

    try {
      const supportsShare =
        typeof navigator !== "undefined" &&
        "share" in navigator &&
        "canShare" in navigator;

      if (supportsShare) {
        const res = await fetch(vcardUrl);
        const text = await res.text();

        const blob = new Blob([text], { type: "text/x-vcard" });
        const file = new File([blob], `${full.replace(/\s+/g, "_")}.vcf`, {
          type: "text/x-vcard",
        });

        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            title: `Contacto de ${full}`,
            text: `Guardar contacto de ${full}`,
            files: [file],
          });
          return;
        }
      }
    } catch {
      // ignorar y seguir con fallback
    }

    window.location.href = vcardUrl;
  }

  return (
    <main
      className="min-h-screen w-[100vw] bg-no-repeat bg-cover bg-top"
      style={{ backgroundImage: "url(/background.jpg)" }}
    >
      {/* FULL BLEED en móvil; centrado y con marco en desktop */}
      <section className="w-[100vw] md:max-w-[430px] md:mx-auto">
        {/* Tarjeta sin bordes ni sombras en móvil. En desktop sí. */}
        <div className="relative w-full bg-[#f1f1f1] overflow-hidden rounded-none md:rounded-3xl md:shadow-2xl">
          {/* HEADER (solo arriba) con color primario */}
          <div className="relative w-full" style={{ background: primary }}>
            <div className="h-[150px] w-full" />
            {/* Foto píldora */}
            <div className="absolute left-1/2 bottom-0 translate-y-[30%] md:translate-y-[28%] -translate-x-1/2">
              <div className="w-[120px] h-[160px] md:w-[132px] md:h-[188px] rounded-[999px] border-3 border-white shadow-xl overflow-hidden bg-white relative">
                <Image
                  src={profile.avatar_url || "/defaults/avatar-placeholder.png"}
                  alt={full}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 120px, 132px"
                  priority
                />
              </div>
            </div>
          </div>

          {/* BODY */}
          <div className="px-4 pt-[60px] pb-2 text-center md:px-6 md:pt-[96px]">
            <h1 className="font-rc font-[700] text-[24px] md:text-[26px] leading-[0.8] text-black tracking-tight">
              {full}
            </h1>

            {(profile.position || profile.company) && (
              <p
                className="font-rc font-normal text-[15px] md:text-[17px] mt-1"
                style={{ color: "#707070" }}
              >
                {posCompany}
              </p>
            )}

            {profile.mini_bio && (
              <div className="mt-3">
                <p
                  className="font-rc font-normal text-[14px] md:text-[16px] leading-relaxed"
                  style={{ color: "#a3a3a3" }}
                >
                  {profile.mini_bio}
                </p>
              </div>
            )}

            <div className="mt-5 border-t border-gray-200" />
          </div>

          {/* CTAs */}
          <div className="px-3 pb-6 flex flex-col items-center gap-3 md:px-4 w-9/10 mx-auto">
            {ctas.map((b) => {
              // Forzamos TODOS los botones a color secundario (negro)
              const usePrimary = false;
              const bg = usePrimary ? primary : secondarySafe; // -> siempre secundario
              const contrast = usePrimary ? secondarySafe : primary; // -> siempre primario

              const iconColor = pickAccessibleIconColor(bg, contrast, 3);

              return (
                <a
                  key={b.key}
                  href={b.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full rounded-[32px] px-5 h-[56px] md:h-[60px] flex items-center shadow-md"
                  style={{ background: bg, color: "#fff" }}
                >
                  <span
                    className="inline-grid place-items-center h-9 w-9 mr-3 rounded-full border-2"
                    style={{ borderColor: contrast }}
                  >
                    <IconMask src={b.icon} color={iconColor} />
                  </span>
                  <span className="uppercase font-pop font-normal flex-1 text-left tracking-wide text-[16px] md:text-[18px] ">
                    {b.label}
                  </span>
                </a>
              );
            })}
          </div>

          {/* Línea + badge final */}
          <div className="px-6 pb-6">
            <div className="border-t border-gray-200 pt-4 flex justify-center">
              <Link
                href="/sede-wow"
                className="inline-block bg-gray-200 text-gray-500 px-3 py-1 rounded-full text-[11px] md:text-xs font-normal"
              >
                Crea tu sede W🤩W!
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Botón flotante */}
      <a
        href={vcardUrl}
        onClick={handleSaveContact}
        aria-label="Guardar contacto (vCard)"
        className="fixed bottom-1 right-1 rounded-full border-2 shadow-xl grid place-items-center origin-bottom-right"
        style={{
          width: 77,
          height: 77,
          background: hexToRgba(floatColor, 0.8),
          borderColor: "#fff",
        }}
      >
        <div className="flex flex-col items-center justify-center">
          <Image
            src="/icons/guardarusuario.svg"
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 mb-0"
            priority
          />
          <span className="font-pop font-normal text-black text-[10px] leading-tight text-center -mt-1 leading-{10px}">
            Guardar
            <br />
            Contacto
          </span>
        </div>
      </a>
    </main>
  );
}
