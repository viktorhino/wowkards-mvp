"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { TemplateLayout } from "@/templates/types";
import { suggestSlug, normalizeSlug } from "@/lib/slug";
import { normalizeWhatsapp } from "@/lib/phone";
import { z } from "zod";
const emailSchema = z.string().email();

// ==================== Utils e iconos (pueden ir fuera) ====================

// Solo dígitos y un único '+' al inicio
function sanitizeTelInput(raw: string) {
  let s = raw.replace(/[^\d+]/g, "");
  if (s.startsWith("+")) s = "+" + s.slice(1).replace(/\+/g, "");
  else s = s.replace(/\+/g, "");
  return s;
}

// Agrupa dígitos para máscara
function applyGroups(digits: string, groups: number[], sep = "-") {
  const out: string[] = [];
  let i = 0;
  for (const g of groups) {
    if (i >= digits.length) break;
    out.push(digits.slice(i, i + g));
    i += g;
  }
  if (i < digits.length) out.push(digits.slice(i));
  return out.filter(Boolean).join(sep);
}

// Máscara visual: CO => +57-3xx-xxx-xx-xx ; otros => +<digits> sin grupos
function maskWhatsappDisplay(raw: string, defaultCC = "+57") {
  let s = sanitizeTelInput(raw);
  if (!s.startsWith("+"))
    s = defaultCC + s.replace(/\D/g, "").replace(/^0+/, "");
  const digits = s.replace(/\D/g, "");
  if (digits.startsWith("57")) {
    const nat = digits.slice(2); // nacional
    const maskedNat = applyGroups(nat, [3, 3, 2, 2]);
    return "+57-" + maskedNat.replace(/-$/, "");
  }
  return "+" + digits;
}

// Paste limpio con actualización de estados
function handleTelPaste(
  e: React.ClipboardEvent<HTMLInputElement>,
  setRaw: (v: string) => void,
  setDisp: (v: string) => void,
  setValid: (v: boolean | null) => void
) {
  e.preventDefault();
  const pasted = e.clipboardData.getData("text");
  const clean = sanitizeTelInput(pasted);
  setRaw(clean);
  setDisp(maskWhatsappDisplay(clean));
  setValid(normalizeWhatsapp(clean).valid);
}

// Iconos inline
const IconCheck = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path
      fillRule="evenodd"
      d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3-3A1 1 0 016.757 9.793l2.293 2.293 6.543-6.543a1 1 0 011.414 0z"
      clipRule="evenodd"
    />
  </svg>
);
const IconX = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path
      fillRule="evenodd"
      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
      clipRule="evenodd"
    />
  </svg>
);
const IconSpinner = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...props}>
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
      className="opacity-25 fill-none"
    />
    <path d="M4 12a8 8 0 018-8" className="opacity-75" fill="currentColor" />
  </svg>
);

const LAYOUTS: TemplateLayout[] = ["cardA", "cardB", "cardC"];

type ExtraKind =
  | "direccion"
  | "instagram"
  | "facebook"
  | "tiktok"
  | "x"
  | "otro";
type ExtraRow = { id: string; kind: ExtraKind; label: string; value: string };

// Campos únicos (no repetibles)
const UNIQUE_KINDS: Exclude<ExtraKind, "otro">[] = [
  "direccion",
  "instagram",
  "facebook",
  "tiktok",
  "x",
];

const KIND_LABEL: Record<Exclude<ExtraKind, "otro">, string> = {
  direccion: "Dirección",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  x: "X",
};

function isHexColor(v: string) {
  return /^#([0-9a-f]{6}|[0-9a-f]{3})$/i.test(v.trim());
}

// ==================== Componente ====================

export default function ClaimForm({ code }: { code: string }) {
  // Básicos
  const [name, setName] = useState("");
  const [last, setLast] = useState("");

  // Slug
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugOk, setSlugOk] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  // WhatsApp (máscara/validación)
  const [whatsapp, setWhatsapp] = useState(""); // crudo/sanitizado
  const [waDisplay, setWaDisplay] = useState(""); // con máscara
  const [waValid, setWaValid] = useState<boolean | null>(null);

  // Email
  const [email, setEmail] = useState("");
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailTaken, setEmailTaken] = useState(false);

  // Otros
  const [bio, setBio] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  const [layout, setLayout] = useState<TemplateLayout>("cardA");
  const [primary, setPrimary] = useState("#0A66FF");
  const [accent, setAccent] = useState("#4FB0FF");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);

  // Cámara nativa (input oculto)
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Extras (máx 3)
  const [extras, setExtras] = useState<ExtraRow[]>([]);

  // --------- EXTRAS sin duplicados ----------
  const usedUniqueKinds = useMemo(
    () =>
      new Set(
        extras.map((e) => e.kind).filter((k) => k !== "otro") as Exclude<
          ExtraKind,
          "otro"
        >[]
      ),
    [extras]
  );

  const firstAvailableKind = useMemo(() => {
    for (const k of UNIQUE_KINDS) if (!usedUniqueKinds.has(k)) return k;
    return null;
  }, [usedUniqueKinds]);

  const canAddExtra =
    extras.length < 3 && (firstAvailableKind !== null || true); // podemos agregar "otro"

  function addExtra() {
    if (!canAddExtra) return;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const kind: ExtraKind = firstAvailableKind ?? "otro";
    setExtras((prev) => [
      ...prev,
      {
        id,
        kind,
        label:
          kind === "otro" ? "" : KIND_LABEL[kind as Exclude<ExtraKind, "otro">],
        value: "",
      },
    ]);
  }

  function removeExtra(id: string) {
    setExtras((prev) => prev.filter((e) => e.id !== id));
  }

  function updateExtra(id: string, patch: Partial<ExtraRow>) {
    setExtras((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        const next: ExtraRow = { ...e, ...patch };
        if (patch.kind) {
          const nk = patch.kind;
          if (nk !== "otro")
            next.label = KIND_LABEL[nk as Exclude<ExtraKind, "otro">];
          else if (e.kind !== "otro") next.label = "";
        }
        return next;
      })
    );
  }

  // --------- SLUG ----------
  useEffect(() => {
    if (slugTouched) return;
    const s = suggestSlug(name || "", last || "");
    setSlug(s);
  }, [name, last, slugTouched]);

  useEffect(() => {
    if (!slug) {
      setSlugOk(null);
      return;
    }
    const t = setTimeout(async () => {
      setChecking(true);
      try {
        const res = await fetch(
          `/api/slug/check?slug=${encodeURIComponent(slug)}`
        );
        const json = await res.json();
        setSlugOk(!!json?.available);
      } finally {
        setChecking(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [slug]);

  // Detección móvil
  useEffect(() => {
    const ua = navigator.userAgent || navigator.vendor || "";
    const mobileUA =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobi/i.test(
        ua
      );
    const touch = (navigator.maxTouchPoints ?? 0) > 0;
    const coarse = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
    setIsMobile(mobileUA || (touch && coarse));
  }, []);

  function onSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = normalizeSlug(e.target.value);
    setSlug(v);
    setSlugTouched(v.length > 0);
    if (v.length === 0) setSlugOk(null);
  }

  // --------- EMAIL ----------
  function onEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value.toLowerCase();
    setEmail(v);
    setEmailValid(emailSchema.safeParse(v).success);
    setEmailTaken(false);
  }

  useEffect(() => {
    if (!emailValid) {
      setEmailTaken(false);
      return;
    }
    const t = setTimeout(async () => {
      setEmailChecking(true);
      try {
        const res = await fetch(
          `/api/email/check?email=${encodeURIComponent(email)}`
        );
        const j = await res.json();
        setEmailTaken(!!j?.taken);
      } finally {
        setEmailChecking(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [email, emailValid]);

  // --------- WHATSAPP ----------
  function onWhatsappChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = sanitizeTelInput(e.target.value);
    setWhatsapp(raw);
    setWaDisplay(maskWhatsappDisplay(raw));
    setWaValid(normalizeWhatsapp(raw).valid);
  }

  function onWhatsappBlur() {
    const norm = normalizeWhatsapp(whatsapp);
    setWhatsapp(norm.e164);
    setWaDisplay(maskWhatsappDisplay(norm.e164));
    setWaValid(norm.valid);
  }

  // --------- SUBMIT ----------
  const canSubmit = useMemo(
    () =>
      code &&
      name.trim() &&
      last.trim() &&
      slugOk === true &&
      waValid === true &&
      emailValid === true &&
      isHexColor(primary) &&
      isHexColor(accent),
    [code, name, last, slugOk, waValid, emailValid, primary, accent]
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    const { e164: waE164, valid } = normalizeWhatsapp(whatsapp);
    if (!valid) {
      alert("WhatsApp no es válido");
      return;
    }
    const slugFinal = normalizeSlug(slug);
    const emailLower = (email || "").trim().toLowerCase();

    const extrasOut = extras
      .map((it) => ({
        kind: it.kind,
        label:
          it.kind === "otro"
            ? it.label?.trim() || "Dato"
            : KIND_LABEL[it.kind as Exclude<ExtraKind, "otro">],
        value: it.value.trim(),
      }))
      .filter((x) => x.value.length > 0);

    const body = {
      code,
      name,
      last_name: last,
      whatsapp: waE164,
      email: emailLower, // <- clave correcta
      slug: slugFinal,
      template_config: {
        layout,
        brand: { primary, accent },
        bio: bio || undefined,
        photoDataUrl: photoDataUrl || undefined,
        extras: extrasOut.length ? extrasOut : undefined,
      },
    };

    const res = await fetch("/api/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const json = await res.json();
    if (json?.ok && json?.slug) window.location.href = `/${json.slug}`;
    else alert(json?.error || "No se pudo reclamar el código.");
  }

  // Handlers de archivo
  function onFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoDataUrl(String(reader.result));
    reader.readAsDataURL(f);
  }

  function triggerNativeCamera() {
    cameraInputRef.current?.click();
  }

  function onCameraCaptureChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoDataUrl(String(reader.result));
    reader.readAsDataURL(f);
  }

  // ==================== Render ====================
  return (
    <form onSubmit={onSubmit} className="max-w-md mx-auto p-4 space-y-4">
      <h1 className="text-xl font-semibold">Activar tu WOWKard ({code})</h1>

      {/* Nombre/Apellido */}
      <div className="grid grid-cols-2 gap-3">
        <input
          className="border rounded p-2"
          placeholder="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="border rounded p-2"
          placeholder="Apellido"
          value={last}
          onChange={(e) => setLast(e.target.value)}
        />
      </div>

      {/* Tu URL en una sola línea */}
      <div className="flex items-center gap-2 text-sm">
        <span className="whitespace-nowrap">Tu URL sería: mi.wowkard.es/</span>
        <input
          className="border rounded px-2 py-1 w-44 sm:w-56"
          value={slug}
          onChange={onSlugChange}
          onBlur={() => setSlug(normalizeSlug(slug))}
          aria-label="Slug"
        />
        <span className="inline-flex items-center justify-center w-5 h-5">
          {checking ? (
            <IconSpinner
              className="w-5 h-5 animate-spin text-gray-400"
              aria-label="Comprobando"
            />
          ) : slug && slugOk === true ? (
            <IconCheck
              className="w-5 h-5 text-green-600"
              aria-label="Disponible"
            />
          ) : slug && slugOk === false ? (
            <IconX className="w-5 h-5 text-red-600" aria-label="Ocupado" />
          ) : null}
        </span>
      </div>

      {/* WhatsApp */}
      <div>
        <div className="flex items-center gap-2">
          <input
            className="border rounded p-2 flex-1"
            placeholder="WhatsApp"
            value={waDisplay}
            onChange={onWhatsappChange}
            onBlur={onWhatsappBlur}
            onPaste={(e) =>
              handleTelPaste(e, setWhatsapp, setWaDisplay, setWaValid)
            }
            inputMode="tel"
            autoComplete="tel"
            // IMPORTANTE: escapar las barras en TSX
            pattern="^\\+?\\d(?:[ -]?\\d)*$"
            aria-label="WhatsApp"
          />
          <span className="inline-flex items-center justify-center w-5 h-5">
            {waValid === true ? (
              <IconCheck
                className="w-5 h-5 text-green-600"
                aria-label="válido"
              />
            ) : waValid === false ? (
              <IconX className="w-5 h-5 text-red-600" aria-label="inválido" />
            ) : null}
          </span>
        </div>
        {waValid === false && (
          <p className="text-xs text-red-600 mt-1">
            Número inválido. Si no pones indicativo, agregamos +57
            automáticamente.
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <div className="flex items-center gap-2">
          <input
            type="email"
            autoComplete="email"
            className="border rounded p-2 flex-1"
            placeholder="Email"
            value={email}
            onChange={onEmailChange}
            aria-invalid={emailValid === false || emailTaken ? "true" : "false"}
          />
        </div>
        <div className="flex items-center gap-2 h-5">
          {emailChecking ? (
            <IconSpinner className="w-5 h-5 animate-spin text-gray-400" />
          ) : emailValid && !emailTaken ? (
            <IconCheck className="w-5 h-5 text-green-600" />
          ) : emailValid === false || emailTaken ? (
            <IconX className="w-5 h-5 text-red-600" />
          ) : null}
        </div>
        {emailValid === false && (
          <p className="text-xs text-red-600 mt-1">
            Correo inválido. Ej: nombre@dominio.com
          </p>
        )}
        {emailValid && emailTaken && (
          <p className="text-xs text-amber-600 mt-1">
            Ya existe un perfil con este correo. Puedes continuar si es
            intencional.
          </p>
        )}
      </div>

      {/* Mini bio */}
      <textarea
        className="border rounded p-2 w-full"
        rows={3}
        placeholder="Mini bio (opcional)"
        value={bio}
        onChange={(e) => setBio(e.target.value)}
      />

      {/* Foto */}
      <div className="space-y-3">
        {/* 1 línea: label + botones */}
        <div className="flex items-center gap-3">
          <span className="text-sm">Foto (opcional)</span>

          {/* Subir foto: SIEMPRE visible */}
          <label className="border rounded px-3 py-2 cursor-pointer">
            Subir foto
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFileSelect}
            />
          </label>

          {/* Tomar foto: SOLO en móvil -> abre la app de cámara */}
          {isMobile && (
            <>
              <button
                type="button"
                className="border rounded px-3 py-2"
                onClick={triggerNativeCamera}
              >
                Tomar foto
              </button>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment" // cámara trasera (usar "user" para frontal)
                className="hidden"
                onChange={onCameraCaptureChange}
              />
            </>
          )}

          {photoDataUrl && (
            <button
              type="button"
              className="ml-auto text-sm underline"
              onClick={() => setPhotoDataUrl(null)}
            >
              Quitar foto
            </button>
          )}
        </div>

        {/* Vista previa (si hay foto) */}
        {photoDataUrl && (
          <img
            src={photoDataUrl}
            alt="preview"
            className="w-32 h-32 object-cover rounded-full border"
          />
        )}
      </div>

      {/* Extras */}
      <div className="space-y-2">
        <label className="text-sm block">Otros datos (máx. 3)</label>

        {extras.map((row) => {
          const usedInOthers = new Set(
            extras
              .filter((e) => e.id !== row.id && e.kind !== "otro")
              .map((e) => e.kind as Exclude<ExtraKind, "otro">)
          );

          return (
            <div key={row.id} className="grid grid-cols-12 gap-2 items-center">
              <select
                className="border rounded p-2 col-span-4"
                value={row.kind}
                onChange={(e) =>
                  updateExtra(row.id, { kind: e.target.value as ExtraKind })
                }
              >
                {UNIQUE_KINDS.map((k) => (
                  <option
                    key={k}
                    value={k}
                    disabled={usedInOthers.has(k as any)}
                  >
                    {KIND_LABEL[k]}
                  </option>
                ))}
                <option value="otro">Otro</option>
              </select>

              {row.kind === "otro" && (
                <input
                  className="border rounded p-2 col-span-3"
                  placeholder="Etiqueta (ej: Cargo)"
                  value={row.label}
                  onChange={(e) =>
                    updateExtra(row.id, { label: e.target.value })
                  }
                />
              )}

              <input
                className={`border rounded p-2 ${
                  row.kind === "otro" ? "col-span-4" : "col-span-7"
                }`}
                placeholder={
                  row.kind === "direccion"
                    ? "Tu dirección"
                    : row.kind === "instagram"
                    ? "@usuario"
                    : row.kind === "facebook"
                    ? "usuario o URL"
                    : row.kind === "tiktok"
                    ? "@usuario"
                    : row.kind === "x"
                    ? "@usuario"
                    : "Valor"
                }
                value={row.value}
                onChange={(e) => updateExtra(row.id, { value: e.target.value })}
              />

              <button
                type="button"
                className="border rounded px-3 py-2 col-span-1"
                onClick={() => removeExtra(row.id)}
                aria-label="Eliminar"
                title="Eliminar"
              >
                ✕
              </button>
            </div>
          );
        })}

        <button
          type="button"
          className="w-full rounded-xl border-2 border-dashed py-3 font-medium"
          onClick={addExtra}
          disabled={!canAddExtra}
        >
          {canAddExtra ? "Agregar otros datos" : "Límite de 3 alcanzado"}
        </button>
      </div>

      {/* Diseño + colores */}
      <div>
        <label className="text-sm block mb-1">Diseño de tarjeta</label>
        <select
          className="border rounded p-2 w-full"
          value={layout}
          onChange={(e) => setLayout(e.target.value as TemplateLayout)}
        >
          {LAYOUTS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm block mb-1">Color primario</label>
          <input
            type="color"
            className="h-10 w-full p-1 border rounded"
            value={primary}
            onChange={(e) => setPrimary(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm block mb-1">Color acento</label>
          <input
            type="color"
            className="h-10 w-full p-1 border rounded"
            value={accent}
            onChange={(e) => setAccent(e.target.value)}
          />
        </div>
      </div>

      <button
        disabled={!canSubmit}
        className="w-full rounded-2xl py-3 font-semibold text-white disabled:opacity-50"
        style={{ background: primary }}
      >
        Guardar y activar
      </button>
    </form>
  );
}
