"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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

// Helpers
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

// Slug con guiones entre palabras (nombre + apellido)
const generateSlug = (first: string, last: string) => {
  const full = `${normalizeSpaces(first)} ${normalizeSpaces(last)}`.trim();
  return full
    .toLocaleLowerCase("es-ES")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quitar tildes
    .replace(/[^\p{L}\p{N}\s-]+/gu, "") // quitar símbolos raros
    .replace(/\s+/g, "-") // espacios -> guion
    .replace(/-+/g, "-") // colapsar guiones
    .replace(/^-|-$/g, ""); // bordes
};

// Evitar duplicados en extras
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

export default function ClaimForm({ code }: Props) {
  const router = useRouter();

  // Campos base
  const [name, setName] = useState("");
  const [last, setLast] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");

  // Slug
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  // Extras
  const [extras, setExtras] = useState<ExtraItem[]>([]);
  const [extraErrors, setExtraErrors] = useState<boolean[]>([]);

  // Estado general
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Autogenerar slug (con guiones) mientras no se haya tocado manualmente
  useEffect(() => {
    if (slugTouched) return;
    setSlug(generateSlug(name, last));
  }, [name, last, slugTouched]);

  // Chequeo en vivo del slug
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

    // Validar extras: ninguno vacío
    if (extras.length > 0) {
      const errs = extras.map((ex) => !ex.value.trim());
      setExtraErrors(errs);
      if (errs.some(Boolean)) {
        setError("Completa todos los “otros datos” agregados o quítalos.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const body = {
        code,
        name: capitalizeWords(name),
        last_name: capitalizeWords(last),
        whatsapp: whatsapp.replace(/\D/g, ""),
        email,
        slug: s,
        template_config: { extra: extras },
      };

      const res = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok || !json.ok)
        throw new Error(json.error || "No se pudo reclamar el código.");

      router.push(`/${json.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
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

        {/* Otros datos (arriba del botón) */}
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
