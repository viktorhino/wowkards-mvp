"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import type { PublicProfile } from "@/templates/types";
import { getPalette } from "@/templates/types";

/* ---------- helpers UI (alineados con CardA) ------------------------- */
const cleanPhone = (p?: string) => (p || "").replace(/\D/g, "");

// Aclara un color HEX mezclándolo con blanco en 'percent'% (0–100)
const lighten = (hex: string, percent = 40) => {
  const h = hex.replace("#", "");
  const num = parseInt(
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
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
};

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

const ICONS = {
  wa: "/icons/whatsapp.svg",
  email: "/icons/email.svg",
  share: "/icons/share.svg",
  instagram: "/icons/instagram.svg",
  facebook: "/icons/facebook.svg",
  tiktok: "/icons/tiktok.svg",
  x: "/icons/x.svg",
  direccion: "/icons/direccion.svg",
  link: "/icons/link.svg",
} as const;

/* ----------------------------- component ----------------------------- */
type ExtraIn = { kind?: string; label?: string; value?: string };

export default function CardB({ profile }: { profile: PublicProfile }) {
  const brand = getPalette(profile.template_config);
  const primary = brand.primary || "#FFC400";
  const secondary = brand.accent || "#111111"; // CTAs en negro

  const fullName =
    `${profile.name ?? ""} ${profile.last_name ?? ""}`.trim() || "Tu Nombre";
  const roleCompany = [profile.position, profile.company]
    .filter(Boolean)
    .join(" - ");

  // WhatsApp
  const phone = cleanPhone(profile.whatsapp);
  const waHref = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(
        `Hola ${profile.name}. Me encanta la tarjeta digital de tu Sede WOW!`
      )}`
    : undefined;

  // Email
  const emailHref = profile.email ? `mailto:${profile.email}` : undefined;

  // Compartir (página intermedia; se mantiene igual)
  /*  const shareHref = `/share-contact?slug=${encodeURIComponent(
    profile.slug || ""
  )}`;*/

  // Extras (ig, fb, tiktok, x, direccion…)
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

  // Añadir website si viene en profile (sin mutar el array tipado)
  const extrasWithWebsite: ExtraIn[] = profile.website
    ? [
        ...extras,
        {
          kind: "website",
          label: "MI SITIO WEB",
          value: profile.website.startsWith("http")
            ? profile.website
            : `https://${profile.website}`,
        },
      ]
    : extras;

  /* --------- URL al endpoint /api/vcard (como en CardA) ---------------- */
  const intlPhone = phone
    ? phone.startsWith("+")
      ? phone
      : `+${phone}`
    : undefined;

  const params = new URLSearchParams();
  params.set("fullName", fullName);
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

  async function handleSaveContact(e: React.MouseEvent<HTMLAnchorElement>) {
    // Misma experiencia que CardA: intenta Web Share con archivo .vcf
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
        const file = new File([blob], `${fullName.replace(/\s+/g, "_")}.vcf`, {
          type: "text/x-vcard",
        });

        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            title: `Contacto de ${fullName}`,
            text: `Guardar contacto de ${fullName}`,
            files: [file],
          });
          return;
        }
      }
    } catch {
      // silencioso: hacemos fallback
    }
    // Fallback: descarga/abre el .vcf
    window.location.href = vcardUrl;
  }
  /* -------------------------------------------------------------------- */

  return (
    <main className="min-h-screen w-full bg-[#e9e9e9]">
      <section className="font-rc w-full md:max-w-[520px] md:mx-auto">
        {/* HEADER: incluye foto, nombre, cargo/minibio y 3 CTAs  */}
        <div className="w-full" style={{ background: primary }}>
          <div className="px-3 pt-3 pb-6 md:px-8">
            {/* Foto grande circular */}
            <div className="w-full flex justify-center">
              <div className="relative">
                <div className="w-[200px] h-[200px] rounded-full border-3 border-white shadow-xl overflow-hidden bg-white relative">
                  <Image
                    src={
                      profile.avatar_url || "/defaults/avatar-placeholder.png"
                    }
                    alt={fullName}
                    fill
                    className="object-cover"
                    sizes="200px"
                    unoptimized
                    priority
                  />
                </div>
              </div>
            </div>

            {/* Nombre y cargo */}
            <div className="text-center mt-3">
              <h1 className="font-rc font-[700] text-[26px] md:text-[30px] tracking-tight text-black ">
                {fullName}
              </h1>
              {roleCompany && (
                <p className="font-rc text-[16px] mt-0 text-[#585858] tracking-tight">
                  {roleCompany}
                </p>
              )}
              {profile.mini_bio && (
                <p className="font-rc text-[14px] mt-4 text-[#5b5b5b] leading-relaxed tracking-tight">
                  {profile.mini_bio}
                </p>
              )}
            </div>
            <div className="my-2 border-t border-gray-200" />

            {/* Fila de 3 CTAs (negros con icono blanco) */}
            <div className="mt-7 grid grid-cols-3 gap-1">
              {/* WhatsApp */}
              <a
                href={waHref || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className={`rounded-[18px] py-4 grid place-items-center shadow-md ${
                  waHref ? "opacity-100" : "opacity-40 pointer-events-none"
                }`}
                style={{ background: secondary, color: "#fff" }}
              >
                <IconMask src={ICONS.wa} color="#fff" />
                <span className="font-pop text-[12px] mt-1">Hablemos!</span>
              </a>

              {/* Email */}
              <a
                href={emailHref || "#"}
                className={`rounded-[18px] py-4 grid place-items-center shadow-md ${
                  emailHref ? "opacity-100" : "opacity-40 pointer-events-none"
                }`}
                style={{ background: secondary, color: "#fff" }}
              >
                <IconMask src={ICONS.email} color="#fff" />
                <span className="font-pop text-[12px] mt-1">Escríbeme</span>
              </a>

              {/* Compartir (a página intermedia) de momento no funciona luego debe ir href={shareHref} */}
              <a
                href="#"
                className="rounded-[18px] py-4 grid place-items-center shadow-md"
                style={{ background: secondary, color: "#fff" }}
              >
                <IconMask src={ICONS.share} color="#fff" />
                <span className="font-pop text-[12px] mt-1">Compartir</span>
              </a>
            </div>
          </div>
        </div>

        {/* Zona baja gris: badges blancos con franja izquierda amarilla */}
        <div className="px-5 py-6 bg-[#e9e9e9]">
          <div className="flex flex-col gap-4">
            {extrasWithWebsite.map((ex, i) => {
              if (!ex?.value) return null;

              const kind = (ex.kind || "").toLowerCase();
              let title = ex.label || "";
              const value = ex.value.trim(); // prefer-const
              let href = value;

              if (kind === "instagram" && !/^https?:\/\//i.test(value)) {
                href = `https://instagram.com/${value}`;
                title = title || "INSTAGRAM";
              } else if (kind === "facebook" && !/^https?:\/\//i.test(value)) {
                href = `https://facebook.com/${value}`;
                title = title || "FACEBOOK";
              } else if (kind === "tiktok" && !/^https?:\/\//i.test(value)) {
                href = `https://tiktok.com/@${value}`;
                title = title || "TIKTOK";
              } else if (kind === "x" && !/^https?:\/\//i.test(value)) {
                href = `https://x.com/${value}`;
                title = title || "X";
              } else if (kind === "direccion") {
                href = /^https?:\/\//i.test(value)
                  ? value
                  : `https://maps.google.com/?q=${encodeURIComponent(value)}`;
                title = title || "DIRECCIÓN";
              } else if (kind === "website") {
                title = title || "MI SITIO WEB";
                href = value;
              } else {
                // genérico
                if (/^https?:\/\//i.test(value)) href = value;
                else if (/^(\+?\d[\d\s-]+)$/.test(value))
                  href = `tel:${value.replace(/\s/g, "")}`;
                else if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value))
                  href = `mailto:${value}`;
                else
                  href = `https://www.google.com/search?q=${encodeURIComponent(
                    value
                  )}`;
                title = title || "ENLACE";
              }

              const icon =
                (ICONS as Record<string, string>)[kind] ?? ICONS.link;

              return (
                <a
                  key={`${kind}-${i}-${value}`}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full grid grid-cols-[64px_1fr] rounded-[18px] overflow-hidden shadow-sm"
                >
                  {/* Franja izquierda amarilla con icono blanco */}
                  <div
                    className="h-full grid place-items-center"
                    style={{ background: primary }}
                  >
                    <IconMask src={icon} color="#fff" />
                  </div>

                  {/* Panel blanco con texto */}
                  <div className="bg-white px-4 py-4">
                    <div className="text-[14px] text-[#8b8b8b] font-rc">
                      {title || kind?.toUpperCase()}
                    </div>
                    <div className="text-[20px] leading-tight text-black font-rc mt-1 break-words">
                      {value}
                    </div>
                  </div>
                </a>
              );
            })}
          </div>

          {/* Línea + badge final */}
          <div className="mt-8 border-t border-gray-300 pt-4 flex justify-center">
            <Link
              href="https://mi.sedewow.es/"
              className="inline-block bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-[12px] font-semibold"
            >
              Crea tu sede W🤩W!
            </Link>
          </div>
        </div>

        {/* Botón flotante: **Guardar contacto** (misma UX de CardA) */}
        <a
          href={vcardUrl}
          onClick={handleSaveContact}
          className="fixed bottom-3 right-3 z-20 rounded-full grid place-items-center shadow-xl border-2"
          style={{
            width: 76,
            height: 76,
            background: hexToRgba(lighten(primary, 50), 0.8),
            borderColor: "#fff",
          }}
          aria-label="Guardar contacto"
        >
          <div className="flex flex-col items-center justify-center">
            <Image
              src="/icons/savecontact.svg"
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 mb-0"
              priority
            />
            <span className="font-pop font-normal text-black text-[10px] leading-tight text-center -mt-1">
              Guardar
              <br />
              Contacto
            </span>
          </div>
        </a>
      </section>
    </main>
  );
}
