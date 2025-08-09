"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Props = { code: string };

type CheckResp = { ok: boolean; available: boolean };

const debounce = (fn: (...args: any[]) => void, ms = 300) => {
  let t: any;
  return (...args: any[]) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};

export default function ClaimForm({ code }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [last, setLast] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [slug, setSlug] = useState("");
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sugerir slug cuando cambian nombre/apellido (si el usuario no lo ha tocado manualmente)
  useEffect(() => {
    if (!name && !last) return;
    const suggested = `${(name || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")}${(last || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");
    // solo autocompletar si el usuario no ha escrito nada aún
    setSlug((prev) => (prev ? prev : suggested));
  }, [name, last]);

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
      }, 350),
    []
  );

  useEffect(() => {
    runCheck(slug.trim().toLowerCase());
  }, [slug, runCheck]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const s = slug.trim().toLowerCase();
    if (!name || !last || !s) {
      setError("Completa nombre, apellido y slug.");
      return;
    }
    if (slugAvailable === false) {
      setError("Ese slug ya está ocupado.");
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        code,
        name,
        last_name: last,
        whatsapp: whatsapp.replace(/\D/g, ""),
        email,
        instagram: instagram.replace(/^@/, ""),
        slug: s,
      };

      const res = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "No se pudo reclamar el código.");
      }

      router.push(`/${json.slug}`);
    } catch (err: any) {
      setError(err.message || "Error inesperado.");
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
          <span>WhatsApp (solo números)</span>
          <input
            className="border rounded-md p-2"
            inputMode="numeric"
            value={whatsapp}
            onChange={(e) =>
              setWhatsapp(e.target.value.replace(/[^\d+\s-]/g, ""))
            }
            placeholder="3001234567"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span>Email</span>
          <input
            className="border rounded-md p-2"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span>Instagram (opcional)</span>
          <input
            className="border rounded-md p-2"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder="@usuario"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span>Slug (tu URL pública)</span>
          <input
            className="border rounded-md p-2"
            value={slug}
            onChange={(e) =>
              setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
            }
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
