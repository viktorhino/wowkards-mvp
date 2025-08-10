"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Props = { code: string };
type CheckResp = { ok: boolean; available: boolean };
type ExtraItem = { type: string; value: string };

const EXTRA_OPTIONS = [
  { key: "direccion", label: "Dirección" },
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "tiktok", label: "TikTok" },
  { key: "x", label: "X (Twitter)" },
  { key: "otro", label: "Otro" },
];

const MAX_EXTRAS = 3;

/* -------------------- Helpers -------------------- */

const debounce = <T extends unknown[]>(fn: (...args: T) => void, ms = 300) => {
  let t: ReturnType<typeof setTimeout> | undefined;
  return (...args: T) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};

const normalizeSpaces = (s: string) => s.replace(/\s+/g, " ").trim();

const capitalizeWords = (s: string) => {
  const cleaned = normalizeSpaces(s).toLocaleLowerCase("es-ES");
  return cleaned.replace(
    /(^|\s|-)([\p{L}\p{M}])/gu,
    (_m, sep: string, letter: string) => sep + letter.toLocaleUpperCase("es-ES")
  );
};

const generateSlug = (first: string, last: string) => {
  const full = `${normalizeSpaces(first)} ${normalizeSpaces(last)}`.trim();
  return full
    .toLocaleLowerCase("es-ES")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s-]+/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

const usedTypes = (extras: ExtraItem[], exceptIndex?: number) =>
  new Set(
    extras
      .map((e, i) => (i === exceptIndex ? null : e.type))
      .filter(Boolean) as string[]
  );
const availableTypes = (extras: ExtraItem[], exceptIndex?: number) =>
  EXTRA_OPTIONS.map((o) => o.key).filter(
    (k) => !usedTypes(extras, exceptIndex).has(k)
  );

/* -------------------- Componente -------------------- */

export default function ClaimForm({ code }: Props) {
  const router = useRouter();

  // Base
  const [name, setName] = useState("");
  const [last, setLast] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");

  // Mini bio
  const [miniBio, setMiniBio] = useState("");
  const bioCount = miniBio.length;

  // Slug
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  // Extras
  const [extras, setExtras] = useState<ExtraItem[]>([]);
  const [extraErrors, setExtraErrors] = useState<boolean[]>([]);

  // Foto/archivo (avatar)
  const [fileAvatar, setFileAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Estado general
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Autogenerar slug
  useEffect(() => {
    if (slugTouched) return;
    setSlug(generateSlug(name, last));
  }, [name, last, slugTouched]);

  // Chequeo de slug
  const runCheck = useMemo(
    () =>
      debounce(async (value: string) => {
        if (!value || value.length < 3) {
          setSlugAvailable(null);
          return;
        }
        setChecking(true);
        try {
          const r = await fetch(
            `/api/slug/check?slug=${encodeURIComponent(value)}`
          );
          const json: CheckResp = await r.json();
          setSlugAvailable(json.available);
        } catch {
          setSlugAvailable(null);
        } finally {
          setChecking(false);
        }
      }, 300),
    []
  );

  useEffect(() => {
    const val = slug.trim().toLowerCase();
    if (val.length >= 3) runCheck(val);
  }, [slug, runCheck]);

  const onSlugInput = (raw: string) => {
    const cleaned = raw
      .toLocaleLowerCase("es-ES")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9-]+/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    setSlugTouched(cleaned !== "");
    setSlug(cleaned);
  };

  // Extras
  const addExtra = () => {
    if (extras.length >= MAX_EXTRAS) return;
    const avail = availableTypes(extras);
    if (avail.length === 0) return;
    setExtras((arr) => [...arr, { type: avail[0], value: "" }]);
    setExtraErrors((arr) => [...arr, false]);
  };

  const updateExtra = (idx: number, patch: Partial<ExtraItem>) => {
    setExtras((arr) => {
      const copy = [...arr];
      copy[idx] = { ...copy[idx], ...patch };
      return copy;
    });
  };

  const removeExtra = (idx: number) => {
    setExtras((arr) => arr.filter((_, i) => i !== idx));
    setExtraErrors((arr) => arr.filter((_, i) => i !== idx));
  };

  // Manejo de archivo avatar (subir o tomar foto)
  const handleAvatarFile = (f: File | null) => {
    setFileAvatar(f);
    if (f) {
      const url = URL.createObjectURL(f);
      setAvatarPreview(url);
    } else {
      setAvatarPreview(null);
    }
  };

  // Subir avatar a Supabase y devolver URL pública
  const uploadAvatarIfAny = async (f: File | null, slugForPath: string) => {
    if (!f) return null;
    const path = `${slugForPath}/avatar-${Date.now()}-${f.name.replace(
      /\s+/g,
      "-"
    )}`;
    const { error: upErr } = await supabase.storage
      .from("profiles")
      .upload(path, f, { upsert: true });
    if (upErr) throw upErr;
    const { data } = supabase.storage.from("profiles").getPublicUrl(path);
    return data.publicUrl || null;
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const s = slug.trim().toLowerCase();
    if (!name || !last || !s || !email || !whatsapp) {
      setError("Completa nombre, apellido, WhatsApp, correo y slug.");
      return;
    }
    if (slugAvailable === false) {
      setError("Ese slug ya está ocupado.");
      return;
    }
    if (extras.length > 0) {
      const errs = extras.map((ex) => !ex.value.trim());
      setExtraErrors(errs);
      if (errs.some(Boolean)) {
        setError("Completa todos los “otros datos” agregados o quítalos.");
        return;
      }
    }
    if (miniBio.length > 250) {
      setError("La mini‑biografía no puede superar 250 caracteres.");
      return;
    }

    setSubmitting(true);
    try {
      // 1) Claim -> crea perfil
      const res = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          name: capitalizeWords(name),
          last_name: capitalizeWords(last),
          whatsapp: whatsapp.replace(/\D/g, ""),
          email,
          mini_bio: miniBio,
          slug: s,
          template_config: { extra: extras },
        }),
      });

      // Manejo robusto de respuesta
      let payload: any = null;
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        payload = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text || "Respuesta no‑JSON del servidor.");
      }
      if (!res.ok || !payload?.ok) {
        throw new Error(payload?.error || "No se pudo reclamar el código.");
      }

      const finalSlug = payload.slug as string;

      // 2) Si hay avatar, subirlo y actualizar template_config
      if (fileAvatar) {
        const avatar_url = await uploadAvatarIfAny(fileAvatar, finalSlug);
        if (avatar_url) {
          await fetch("/api/profile/update-media", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug: finalSlug, avatar_url }),
          });
        }
      }

      // 3) Redirigir
      router.push(`/${finalSlug}`);
    } catch (err: any) {
      setError(err?.message || "Error inesperado.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md flex flex-col gap-3 border rounded-2xl p-5"
      >
        <h1 className="text-xl font-bold">Reclamar WOWKard</h1>
        <p className="text-sm text-gray-600">
          Código: <b>{code}</b>
        </p>

        {/* Campos base */}
        <label className="flex flex-col gap-1">
          <span>Nombre</span>
          <input
            className="border rounded-md p-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>

        <label className="flex flex-col gap-1">
          <span>Apellido</span>
          <input
            className="border rounded-md p-2"
            value={last}
            onChange={(e) => setLast(e.target.value)}
            required
          />
        </label>

        <label className="flex flex-col gap-1">
          <span>WhatsApp</span>
          <input
            className="border rounded-md p-2"
            inputMode="numeric"
            value={whatsapp}
            onChange={(e) =>
              setWhatsapp(e.target.value.replace(/[^\d+\s-]/g, ""))
            }
            placeholder="3001234567"
            required
          />
        </label>

        <label className="flex flex-col gap-1">
          <span>Correo</span>
          <input
            className="border rounded-md p-2"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        {/* Mini‑biografía */}
        <label className="flex flex-col gap-1">
          <span>Mini‑biografía (máx. 250)</span>
          <textarea
            className="border rounded-md p-2"
            rows={3}
            maxLength={250}
            value={miniBio}
            onChange={(e) => setMiniBio(e.target.value.slice(0, 250))}
            placeholder="Escribe una breve descripción (máx. 250 caracteres)"
          />
          <span className="text-xs text-gray-500">
            {bioCount}/250 caracteres
          </span>
        </label>

        {/* Slug */}
        <label className="flex flex-col gap-1">
          <span>Slug (tu URL pública)</span>
          <input
            className="border rounded-md p-2"
            value={slug}
            onChange={(e) => onSlugInput(e.target.value)}
            minLength={3}
            required
          />
          <span className="text-xs">
            {checking
              ? "Verificando..."
              : slug.length < 3
              ? ""
              : slugAvailable === false
              ? "No disponible"
              : slugAvailable === true
              ? "Disponible"
              : ""}
          </span>
        </label>

        {/* Extras (arriba del botón) */}
        <div className="mt-2 flex flex-col gap-2">
          {extras.map((it, i) => (
            <div key={i} className="flex items-center gap-2">
              <select
                className="border rounded-md p-2"
                value={it.type}
                onChange={(e) => updateExtra(i, { type: e.target.value })}
              >
                {EXTRA_OPTIONS.map((opt) => {
                  const isUsedElsewhere = usedTypes(extras, i).has(opt.key);
                  return (
                    <option
                      key={opt.key}
                      value={opt.key}
                      disabled={isUsedElsewhere}
                    >
                      {opt.label}
                    </option>
                  );
                })}
              </select>

              <input
                className={`flex-1 border rounded-md p-2 ${
                  extraErrors[i] ? "border-red-500" : ""
                }`}
                placeholder={
                  it.type === "direccion"
                    ? "Calle 123 #45-67"
                    : it.type === "otro"
                    ? "Escribe tu dato"
                    : "@usuario o URL"
                }
                value={it.value}
                onChange={(e) => {
                  updateExtra(i, { value: e.target.value });
                  if (extraErrors[i]) {
                    setExtraErrors((errs) => {
                      const copy = [...errs];
                      copy[i] = false;
                      return copy;
                    });
                  }
                }}
              />

              <button
                type="button"
                onClick={() => removeExtra(i)}
                className="border rounded-md px-2 py-1"
              >
                Quitar
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addExtra}
            disabled={
              extras.length >= MAX_EXTRAS || availableTypes(extras).length === 0
            }
            className="w-full rounded-md border p-3 text-center disabled:opacity-50"
          >
            Agregar otros datos
          </button>
        </div>

        {/* -------- Botones de imagen (mismo renglón) -------- */}
        <div className="flex gap-3 items-center mt-2">
          {/* Subir desde dispositivo */}
          <label className="flex-1 text-center px-4 py-2 border rounded-md cursor-pointer hover:bg-gray-50">
            Subir imagen
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleAvatarFile(e.target.files?.[0] || null)}
            />
          </label>

          {/* Tomar foto (móvil abre cámara) */}
          <label className="flex-1 text-center px-4 py-2 border rounded-md cursor-pointer hover:bg-gray-50">
            Tomar foto
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleAvatarFile(e.target.files?.[0] || null)}
            />
          </label>
        </div>

        {/* Preview y opción limpiar */}
        {avatarPreview && (
          <div className="flex items-center gap-3">
            <img
              src={avatarPreview}
              alt="preview"
              className="w-14 h-14 rounded-full object-cover border"
            />
            <button
              type="button"
              onClick={() => handleAvatarFile(null)}
              className="text-sm underline"
            >
              Quitar imagen
            </button>
          </div>
        )}

        {error && <div className="text-red-600 text-sm">{error}</div>}

        <button
          type="submit"
          disabled={submitting || slugAvailable === false}
          className="rounded-lg bg-black text-white py-2 disabled:opacity-50"
        >
          {submitting ? "Guardando…" : "Crear mi WOWKard"}
        </button>
      </form>
    </div>
  );
}
