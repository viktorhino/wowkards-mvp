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
  const [saving, setSaving] = useState(false);

  // básicos
  const [name, setName] = useState("");
  const [last, setLast] = useState("");
  const [position, setPosition] = useState("");
  const [company, setCompany] = useState("");

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
  const formRef = useRef<HTMLFormElement>(null);
  const fileCamRef = useRef<HTMLInputElement>(null);

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

  // slug sugerido
  useEffect(() => {
    if (slugTouched) return;
    setSlug(suggestSlug(name || "", last || ""));
  }, [name, last, slugTouched]);

  // chequeo de disponibilidad de slug
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

  // extras
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

  // validaciones
  const step1Ok =
    name.trim() &&
    last.trim() &&
    slugOk === true &&
    waValid === true &&
    emailValid === true &&
    !emailTaken;
  const step2Ok = true;
  const step3Ok = isHexColor(primary) && isHexColor(accent) && layout;
  const canSubmit = !!(step1Ok && step2Ok && step3Ok) && !saving;

  // submit -> GUARDA y REDIRIGE A PREVIEW (con ?edit=token&code=CODE o ?code=CODE)
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);

    try {
      const { e164: waE164, valid } = normalizeWhatsapp(whatsapp);
      if (!valid) {
        alert("WhatsApp no es válido");
        setSaving(false);
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

      const codeNorm = String(code || "")
        .trim()
        .toLowerCase();
      if (!codeNorm) {
        alert("Falta el código.");
        setSaving(false);
        return;
      }

      const body = {
        code: codeNorm,
        name: capitalizeWords(name),
        last_name: capitalizeWords(last),
        position: position.trim() || undefined,
        company: company.trim() || undefined,
        whatsapp: waE164,
        email: emailLower,
        slug: slugFinal,
        // Volvemos al contrato original del backend:
        mini_bio: bio || undefined,
        photoDataUrl: photoDataUrl || undefined,

        template_config: {
          layout,
          brand: { primary, accent },
          // bio: bio || undefined,
          // photoDataUrl: photoDataUrl || undefined,
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
        const slugResp = String(json.slug);
        const token =
          typeof json.edit_token === "string" ? json.edit_token : undefined;

        // → Siempre vamos a /preview. Si hay token, PRIORIDAD al token.
        const params = new URLSearchParams();
        if (token) params.set("edit", token);
        if (code) params.set("code", String(code));

        const url = `/preview/${encodeURIComponent(
          slugResp
        )}?${params.toString()}`;
        window.location.assign(url);
      } else {
        const msg = String(json?.error || "");
        if (/code invalid|claimed/i.test(msg)) {
          alert(
            "El código no existe o ya fue reclamado. Verifica que esté bien escrito (minúsculas) o usa otro."
          );
        } else {
          alert(json?.error || "No se pudo reclamar el código.");
        }
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#ffbb00] to-[#ffc833]">
      <div className="w-full mx-auto max-w-2xl px-4 pt-8 pb-2">
        <h1 className="text-[#23242a] text-3xl font-black mb-6 text-center tracking-[-0.05em]">
          Crea tu WOW kard
        </h1>

        <div className="bg-white rounded-2xl shadow-xl min-h-[calc(100vh-160px)] p-4 sm:p-6">
          <form
            id="claimForm"
            ref={formRef}
            onSubmit={onSubmit}
            className="flex flex-col gap-6"
          >
            {/* PASO 1 */}
            <section>
              <div className="mb-3 flex items-center gap-3">
                <span className="inline-flex items-center rounded-full bg-black px-3 py-1 text-xs font-semibold text-[#FFC700]">
                  PASO 1
                </span>
                <h2 className="text-base font-semibold text-[#333]">
                  Datos básicos
                </h2>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    className="bg-white text-slate-900 placeholder-slate-400 rounded-xl px-3 py-2 ring-1 ring-black/10 focus:outline-none focus:ring-2 focus:ring-black/50"
                    placeholder="Nombre"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <input
                    className="bg-white text-slate-900 placeholder-slate-400 rounded-xl px-3 py-2 ring-1 ring-black/10 focus:outline-none focus:ring-2 focus:ring-black/50"
                    placeholder="Apellido"
                    value={last}
                    onChange={(e) => setLast(e.target.value)}
                  />
                </div>

                <div className="mt-3 text-sm">
                  <div className="text-slate-700 mb-1 text-center">
                    Tu URL sería:{" "}
                    <span className="whitespace-nowrap text-slate-700">
                      https://mi.wowkard.es/
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="whitespace-nowrap text-slate-700"></span>
                    <div className="relative flex-1 min-w-0">
                      <input
                        className="bg-white text-slate-900 placeholder-[#cccccd] rounded-lg px-2 py-1 ring-1 ring-black/10 focus:outline-none focus:ring-2 focus:ring-black/50 w-full pr-7 text-center"
                        value={slug}
                        onChange={onSlugChange}
                        onBlur={() => setSlug(normalizeSlug(slug))}
                        aria-label="Slug"
                      />
                      <span className="absolute inset-y-0 right-1 flex items-center justify-center w-5">
                        {checkingSlug ? (
                          <IconSpinner className="w-5 h-5 animate-spin text-slate-400" />
                        ) : slug && slugOk === true ? (
                          <IconCheck className="w-5 h-5 text-green-600" />
                        ) : slug && slugOk === false ? (
                          <IconX className="w-5 h-5 text-red-600" />
                        ) : null}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    className="w-full rounded-xl ring-1 ring-black/10 px-3 py-2"
                    placeholder="Cargo (opcional)"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                  />
                  <input
                    className="w-full rounded-xl ring-1 ring-black/10 px-3 py-2"
                    placeholder="Empresa (opcional)"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3">
                  <div className="relative">
                    <input
                      className="bg-white text-[#24262b] placeholder-[#cccccd] rounded-xl px-3 py-2 ring-1 ring-black/10 focus:outline-none focus:ring-2 focus:ring-black/50 flex-1 w-full"
                      placeholder="WhatsApp"
                      value={waDisplay}
                      onChange={onWhatsappChange}
                      onBlur={onWhatsappBlur}
                      onPaste={(e) =>
                        handleTelPaste(e, setWhatsapp, setWaDisplay, setWaValid)
                      }
                      inputMode="tel"
                      autoComplete="tel"
                      pattern="^\\+?[0-9](?:[\\s-]?[0-9]){5,14}$"
                      //pattern="^\\+?\\d(?:[ -]?\\d)*$"
                      aria-label="WhatsApp"
                    />
                    <span className="absolute inset-y-0 right-1 flex items-center justify-center w-5">
                      {waValid === true ? (
                        <IconCheck className="w-5 h-5 text-green-600" />
                      ) : waValid === false ? (
                        <IconX className="w-5 h-5 text-red-600" />
                      ) : null}
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="email"
                      autoComplete="email"
                      className="bg-white text-slate-900 placeholder-slate-400 rounded-xl px-3 py-2 ring-1 ring-black/10 focus:outline-none focus:ring-2 focus:ring-black/50 flex-1 w-full"
                      placeholder="Email"
                      value={email}
                      onChange={onEmailChange}
                      aria-invalid={
                        emailValid === false || emailTaken ? "true" : "false"
                      }
                    />
                    <span className="absolute inset-y-0 right-2 flex items-center justify-center w-5">
                      {emailChecking ? (
                        <IconSpinner className="w-5 h-5 animate-spin text-slate-400" />
                      ) : emailValid && !emailTaken ? (
                        <IconCheck className="w-5 h-5 text-green-600" />
                      ) : emailValid === false || emailTaken ? (
                        <IconX className="w-5 h-5 text-red-600" />
                      ) : null}
                    </span>
                  </div>

                  {waValid === false && (
                    <p className="text-xs text-red-600 -mt-2">
                      Número inválido. Si no pones indicativo, agregamos +57
                      automáticamente.
                    </p>
                  )}
                  {emailValid === false && (
                    <p className="text-xs text-red-600 -mt-2">
                      Correo inválido. Ej: nombre@dominio.com
                    </p>
                  )}
                  {emailValid && emailTaken && (
                    <p className="text-xs text-amber-600 -mt-2">
                      Ya existe un perfil con este correo. Puedes continuar si
                      es intencional.
                    </p>
                  )}
                </div>
              </div>
            </section>

            <hr className="my-4 border-t-1 border-gray-200" />

            {/* PASO 2 */}
            <section>
              <div className="mb-3 flex items-center gap-3">
                <span className="inline-flex items-center rounded-full bg-black px-3 py-1 text-xs font-semibold text-[#FFC700]">
                  PASO 2
                </span>
                <h2 className="text-base font-semibold text-[#333]">
                  Bio y otros datos
                </h2>
              </div>

              <textarea
                className="bg-white text-slate-900 placeholder-slate-400 rounded-xl px-3 py-2 ring-1 ring-black/10 focus:outline-none focus:ring-2 focus:ring-black/50 w-full"
                rows={3}
                placeholder="Mini bio (opcional)"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />

              <div className="mt-4 space-y-2">
                <label className="text-sm block text-slate-800">
                  Otros datos (máx. 3)
                </label>

                {extras.map((row) => {
                  const usedInOthers = new Set(
                    extras
                      .filter((e) => e.id !== row.id && e.kind !== "otro")
                      .map((e) => e.kind as any)
                  );
                  return (
                    <div
                      key={row.id}
                      className="grid grid-cols-12 gap-2 items-center"
                    >
                      <select
                        className="bg-white text-slate-900 rounded-xl px-3 py-2 ring-1 ring-black/10 focus:outline-none focus:ring-2 focus:ring-black/50 col-span-4"
                        value={row.kind}
                        onChange={(e) =>
                          updateExtra(row.id, { kind: e.target.value as any })
                        }
                      >
                        {UNIQUE_KINDS.map((k) => (
                          <option
                            key={k}
                            value={k}
                            disabled={usedInOthers.has(k)}
                          >
                            {KIND_LABEL[k]}
                          </option>
                        ))}
                        <option value="otro">Otro</option>
                      </select>

                      {row.kind === "otro" && (
                        <input
                          className="bg-white text-slate-900 rounded-xl px-3 py-2 ring-1 ring-black/10 focus:outline-none focus:ring-2 focus:ring-black/50 col-span-3"
                          placeholder="Etiqueta (ej: Cargo)"
                          value={row.label}
                          onChange={(e) =>
                            updateExtra(row.id, { label: e.target.value })
                          }
                        />
                      )}

                      <input
                        className={`bg-white text-slate-900 rounded-xl px-3 py-2 ring-1 ring-black/10 focus:outline-none focus:ring-2 focus:ring-black/50 ${
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
                        onChange={(e) =>
                          updateExtra(row.id, { value: e.target.value })
                        }
                      />

                      <button
                        type="button"
                        className="rounded-xl px-3 py-2 col-span-1 bg-white text-slate-800 ring-1 ring-black/10 hover:bg-slate-50"
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
                  className="w-full rounded-xl border-2 border-dashed py-3 font-medium text-slate-800 hover:bg-white/60"
                  onClick={addExtra}
                  disabled={!canAddExtra}
                >
                  {canAddExtra
                    ? "Agregar otros datos"
                    : "Límite de 3 alcanzado"}
                </button>
              </div>
            </section>

            <hr className="my-4 border-t-1 border-gray-200" />

            {/* PASO 3 */}
            <section>
              <div className="mb-3 flex items-center gap-3">
                <span className="inline-flex items-center rounded-full bg-black px-3 py-1 text-xs font-semibold text-[#FFC700]">
                  PASO 3
                </span>
                <h2 className="text-base font-semibold text-[#333]">
                  Foto y diseño
                </h2>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <label className="rounded-xl px-3 py-2 cursor-pointer bg-white text-slate-800 ring-1 ring-black/10 hover:bg-slate-50">
                    Subir foto
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onFileSelect}
                    />
                  </label>

                  {isMobile && (
                    <>
                      <button
                        type="button"
                        className="rounded-xl px-3 py-2 bg-white text-slate-800 ring-1 ring-black/10 hover:bg-slate-50"
                        onClick={() => fileCamRef.current?.click()}
                      >
                        Tomar foto
                      </button>
                      <input
                        ref={fileCamRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={onFileSelect}
                      />
                    </>
                  )}

                  {photoDataUrl && (
                    <button
                      type="button"
                      className="ml-auto text-sm underline text-slate-700"
                      onClick={() => setPhotoDataUrl(null)}
                    >
                      Quitar foto
                    </button>
                  )}
                </div>

                {photoDataUrl && (
                  <img
                    src={photoDataUrl}
                    alt="preview"
                    className="mt-3 w-32 h-32 object-cover rounded-full border border-white/60 shadow-sm"
                  />
                )}

                <div className="mt-4">
                  <label className="text-sm block mb-1 text-slate-800">
                    Diseño de tarjeta
                  </label>
                  <select
                    className="bg-white text-slate-900 rounded-xl px-3 py-2 ring-1 ring-black/10 focus:outline-none focus:ring-2 focus:ring-black/50 w-full"
                    value={layout}
                    onChange={(e) => setLayout(e.target.value as any)}
                  >
                    {LAYOUTS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm block mb-1 text-slate-800">
                      Color primario
                    </label>
                    <input
                      type="color"
                      className="h-10 w-full p-1 bg-white rounded-xl ring-1 ring-black/10"
                      value={primary}
                      onChange={(e) => setPrimary(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm block mb-1 text-slate-800">
                      Color acento
                    </label>
                    <input
                      type="color"
                      className="h-10 w-full p-1 bg-white rounded-xl ring-1 ring-black/10"
                      value={accent}
                      onChange={(e) => setAccent(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </section>
          </form>
        </div>
      </div>

      {/* Barra inferior */}
      <div className="w-full bg-[#000]/80 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl px-4 py-3 flex gap-3">
          <button
            type="button"
            className="flex-1 rounded-full bg-[#FFC62E] text-black py-3 font-semibold shadow-[inset_0_-2px_0_rgba(0,0,0,.18)] disabled:opacity-50 hover:brightness-105"
            disabled={!canSubmit || saving}
            onClick={() => formRef.current?.requestSubmit()}
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
