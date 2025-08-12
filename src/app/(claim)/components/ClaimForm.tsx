"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { TemplateLayout } from "@/templates/types";
import { suggestSlug, normalizeSlug } from "@/lib/slug";
import { normalizeWhatsapp } from "@/lib/phone";
import { z } from "zod";
import { capitalizeWords } from "@/lib/text";

const emailSchema = z.string().email();

/* ───────── utils e iconos ───────── */
function sanitizeTelInput(raw: string) {
  let s = raw.replace(/[^\d+]/g, "");
  if (s.startsWith("+")) s = "+" + s.slice(1).replace(/\+/g, "");
  else s = s.replace(/\+/g, "");
  return s;
}
function capitalizeWords(str: string) {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .filter((word) => word.trim() !== "")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function applyGroups(d: string, groups: number[], sep = "-") {
  const out: string[] = [];
  let i = 0;
  for (const g of groups) {
    if (i >= d.length) break;
    out.push(d.slice(i, i + g));
    i += g;
  }
  if (i < d.length) out.push(d.slice(i));
  return out.filter(Boolean).join(sep);
}
function maskWhatsappDisplay(raw: string, defaultCC = "+57") {
  let s = sanitizeTelInput(raw);
  if (!s.startsWith("+"))
    s = defaultCC + s.replace(/\D/g, "").replace(/^0+/, "");
  const digits = s.replace(/\D/g, "");
  if (digits.startsWith("57")) {
    const nat = digits.slice(2);
    const maskedNat = applyGroups(nat, [3, 3, 2, 2]);
    return "+57-" + maskedNat.replace(/-$/, "");
  }
  return "+" + digits;
}
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

const IconCheck = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 20 20" fill="currentColor" {...p}>
    <path
      fillRule="evenodd"
      d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3-3A1 1 0 016.757 9.793l2.293 2.293 6.543-6.543a1 1 0 011.414 0z"
      clipRule="evenodd"
    />
  </svg>
);
const IconX = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 20 20" fill="currentColor" {...p}>
    <path
      fillRule="evenodd"
      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
      clipRule="evenodd"
    />
  </svg>
);
const IconSpinner = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...p}>
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

/* ───────── componente ───────── */
export default function ClaimForm({ code }: { code: string }) {
  // stepper y estado de guardado
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [saving, setSaving] = useState(false);

  // básicos
  const [name, setName] = useState("");
  const [last, setLast] = useState("");

  // slug
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugOk, setSlugOk] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);

  // whatsapp
  const [whatsapp, setWhatsapp] = useState("");
  const [waDisplay, setWaDisplay] = useState("");
  const [waValid, setWaValid] = useState<boolean | null>(null);

  // email
  const [email, setEmail] = useState("");
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailTaken, setEmailTaken] = useState(false);

  // otros
  const [bio, setBio] = useState("");
  const [layout, setLayout] = useState<TemplateLayout>("cardA");
  const [primary, setPrimary] = useState("#0A66FF");
  const [accent, setAccent] = useState("#4FB0FF");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // extras
  const [extras, setExtras] = useState<ExtraRow[]>([]);
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
  const canAddExtra = extras.length < 3;

  // refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // heurística móvil
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

  // slug sugerido / chequeo
  useEffect(() => {
    if (slugTouched) return;
    setSlug(suggestSlug(name || "", last || ""));
  }, [name, last, slugTouched]);

  useEffect(() => {
    if (!slug) {
      setSlugOk(null);
      return;
    }
    const t = setTimeout(async () => {
      setCheckingSlug(true);
      try {
        const res = await fetch(
          `/api/slug/check?slug=${encodeURIComponent(slug)}`
        );
        const j = await res.json();
        setSlugOk(!!j?.available);
      } finally {
        setCheckingSlug(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [slug]);

  function onSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = normalizeSlug(e.target.value);
    setSlug(v);
    setSlugTouched(v.length > 0);
    if (v.length === 0) setSlugOk(null);
  }

  // email
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

  // whatsapp
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

  // extras helpers
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

  // validaciones por paso
  const step1Ok =
    name.trim() &&
    last.trim() &&
    slugOk === true &&
    waValid === true &&
    emailValid === true &&
    !emailTaken;
  const step2Ok = true; // opcionales
  const step3Ok = isHexColor(primary) && isHexColor(accent) && layout;
  const canSubmit = !!(step1Ok && step2Ok && step3Ok) && !saving;

  // submit con estado "saving"
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);

    try {
      const { e164: waE164, valid } = normalizeWhatsapp(whatsapp);
      if (!valid) {
        alert("WhatsApp no es válido");
        setStep(1);
        return;
      }
      const emailLower = (email || "").trim().toLowerCase();
      const slugFinal = normalizeSlug(slug);

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

      const nameCap = capitalizeWords(name);
      const lastCap = capitalizeWords(last);

      const body = {
        code,
        name: nameCap,
        last_name: lastCap,
        whatsapp: waE164,
        email: emailLower,
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
      if (json?.ok && json?.slug) {
        // redirige y no volvemos a poner saving=false (el navegador cambia)
        window.location.href = `/${json.slug}`;
      } else {
        alert(json?.error || "No se pudo reclamar el código.");
        setSaving(false);
      }
    } catch (err) {
      console.error(err);
      alert("Error de red: intenta nuevamente.");
      setSaving(false);
    }
  }

  // archivo -> dataURL
  function onFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoDataUrl(String(reader.result));
    reader.readAsDataURL(f);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-lg mx-auto p-4 space-y-4"
      aria-busy={saving}
    >
      {/* banner de guardado */}
      {saving && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white text-sm py-2 px-4 flex items-center gap-2 justify-center">
          <IconSpinner className="w-4 h-4 animate-spin" />
          Guardando tu WOWKard…
        </div>
      )}

      <h1 className="text-xl font-semibold text-center">
        Activar tu WOWKard ({code})
      </h1>

      {/* barra de pasos */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className={`h-2 rounded-full transition-all ${
              step >= n ? "bg-blue-600" : "bg-gray-300"
            } ${"w-24"}`}
          />
        ))}
      </div>

      {/* PASO 1 */}
      {step === 1 && (
        <section className="space-y-4 opacity-100">
          <h2 className="font-medium text-sm uppercase tracking-wide text-gray-600">
            Paso 1 · Datos básicos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              className="border rounded p-2"
              placeholder="Nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
            />
            <input
              className="border rounded p-2"
              placeholder="Apellido"
              value={last}
              onChange={(e) => setLast(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="whitespace-nowrap">Tu URL: mi.wowkard.es/</span>
            <input
              className="border rounded px-2 py-1 w-56"
              value={slug}
              onChange={onSlugChange}
              onBlur={() => setSlug(normalizeSlug(slug))}
              aria-label="Slug"
              disabled={saving}
            />
            <span className="inline-flex items-center justify-center w-5 h-5">
              {checkingSlug ? (
                <IconSpinner className="w-5 h-5 animate-spin text-gray-400" />
              ) : slug && slugOk === true ? (
                <IconCheck className="w-5 h-5 text-green-600" />
              ) : slug && slugOk === false ? (
                <IconX className="w-5 h-5 text-red-600" />
              ) : null}
            </span>
          </div>

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
              pattern="^\\+?\\d(?:[ -]?\\d)*$"
              aria-label="WhatsApp"
              disabled={saving}
            />
            <span className="inline-flex items-center justify-center w-5 h-5">
              {waValid === true ? (
                <IconCheck className="w-5 h-5 text-green-600" />
              ) : waValid === false ? (
                <IconX className="w-5 h-5 text-red-600" />
              ) : null}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="email"
              autoComplete="email"
              className="border rounded p-2 flex-1"
              placeholder="Email"
              value={email}
              onChange={onEmailChange}
              aria-invalid={
                emailValid === false || emailTaken ? "true" : "false"
              }
              disabled={saving}
            />
            <span className="inline-flex items-center justify-center w-5 h-5">
              {emailChecking ? (
                <IconSpinner className="w-5 h-5 animate-spin text-gray-400" />
              ) : emailValid && !emailTaken ? (
                <IconCheck className="w-5 h-5 text-green-600" />
              ) : emailValid === false || emailTaken ? (
                <IconX className="w-5 h-5 text-red-600" />
              ) : null}
            </span>
          </div>
          {emailValid === false && (
            <p className="text-xs text-red-600">
              Correo inválido. Ej: nombre@dominio.com
            </p>
          )}
          {emailValid && emailTaken && (
            <p className="text-xs text-amber-600">
              Este correo ya existe; puedes continuar si es intencional.
            </p>
          )}

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!step1Ok || saving}
              className="flex-1 rounded-xl py-3 font-semibold text-white disabled:opacity-50"
              style={{ background: step1Ok && !saving ? "#0A66FF" : "#9CA3AF" }}
            >
              Siguiente
            </button>
          </div>
        </section>
      )}

      {/* PASO 2 */}
      {step === 2 && (
        <section className="space-y-4">
          <h2 className="font-medium text-sm uppercase tracking-wide text-gray-600">
            Paso 2 · Bio y campos extra
          </h2>
          <textarea
            className="border rounded p-2 w-full"
            rows={3}
            placeholder="Mini bio (opcional)"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            disabled={saving}
          />

          <div className="space-y-2">
            <label className="text-sm block">Otros datos (máx. 3)</label>
            {extras.map((row) => {
              const usedInOthers = new Set(
                extras
                  .filter((e) => e.id !== row.id && e.kind !== "otro")
                  .map((e) => e.kind as Exclude<ExtraKind, "otro">)
              );
              return (
                <div
                  key={row.id}
                  className="grid grid-cols-12 gap-2 items-center"
                >
                  <select
                    className="border rounded p-2 col-span-4"
                    value={row.kind}
                    disabled={saving}
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
                      disabled={saving}
                    />
                  )}

                  <input
                    className={`border rounded p-2 ${
                      row.kind === "otro" ? "col-span-4" : "col-span-7"
                    }`}
                    placeholder={
                      row.kind === "direccion"
                        ? "Tu dirección"
                        : row.kind === "instagram" ||
                          row.kind === "tiktok" ||
                          row.kind === "x"
                        ? "@usuario"
                        : row.kind === "facebook"
                        ? "usuario o URL"
                        : "Valor"
                    }
                    value={row.value}
                    onChange={(e) =>
                      updateExtra(row.id, { value: e.target.value })
                    }
                    disabled={saving}
                  />

                  <button
                    type="button"
                    className="border rounded px-3 py-2 col-span-1"
                    onClick={() => removeExtra(row.id)}
                    disabled={saving}
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
              disabled={!canAddExtra || saving}
            >
              {canAddExtra ? "Agregar otros datos" : "Límite de 3 alcanzado"}
            </button>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 rounded-xl py-3 font-semibold border"
              disabled={saving}
            >
              Volver
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="flex-1 rounded-xl py-3 font-semibold text-white"
              style={{ background: "#0A66FF" }}
              disabled={saving}
            >
              Siguiente
            </button>
          </div>
        </section>
      )}

      {/* PASO 3 */}
      {step === 3 && (
        <section className="space-y-4">
          <h2 className="font-medium text-sm uppercase tracking-wide text-gray-600">
            Paso 3 · Foto y diseño
          </h2>

          <div className="flex items-center gap-3">
            <span className="text-sm">Foto (opcional)</span>
            <label className="border rounded px-3 py-2 cursor-pointer">
              Subir foto
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFileSelect}
                ref={fileInputRef}
                disabled={saving}
              />
            </label>
            {isMobile && (
              <label className="border rounded px-3 py-2 cursor-pointer">
                Tomar foto
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={onFileSelect}
                  disabled={saving}
                />
              </label>
            )}
            {photoDataUrl && (
              <button
                type="button"
                className="ml-auto text-sm underline"
                onClick={() => setPhotoDataUrl(null)}
                disabled={saving}
              >
                Quitar foto
              </button>
            )}
          </div>

          {photoDataUrl && (
            <img
              src={photoDataUrl}
              alt="preview"
              className="w-32 h-32 object-cover rounded-full border"
            />
          )}

          <div>
            <label className="text-sm block mb-1">Diseño de tarjeta</label>
            <select
              className="border rounded p-2 w-full"
              value={layout}
              onChange={(e) => setLayout(e.target.value as TemplateLayout)}
              disabled={saving}
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
                disabled={saving}
              />
            </div>
            <div>
              <label className="text-sm block mb-1">Color acento</label>
              <input
                type="color"
                className="h-10 w-full p-1 border rounded"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex-1 rounded-xl py-3 font-semibold border"
              disabled={saving}
            >
              Volver
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex-1 rounded-2xl py-3 font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: primary }}
            >
              {saving ? (
                <>
                  <IconSpinner className="w-5 h-5 animate-spin" /> Guardando…
                </>
              ) : (
                "Guardar y activar"
              )}
            </button>
          </div>
        </section>
      )}
    </form>
  );
}
