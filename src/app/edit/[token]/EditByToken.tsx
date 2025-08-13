"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { normalizeWhatsapp } from "@/lib/phone";
import { normalizeSlug } from "@/lib/slug"; // sólo para mostrar, no se edita
import { capitalizeWords } from "@/lib/text";

type TemplateLayout = "cardA" | "cardB" | "cardC";
const emailSchema = z.string().email();

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

function isHex(v: string) {
  return /^#([0-9a-f]{6}|[0-9a-f]{3})$/i.test(v.trim());
}
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
    const m = applyGroups(nat, [3, 3, 2, 2]);
    return "+57-" + m.replace(/-$/, "");
  }
  return "+" + digits;
}

export default function EditByToken({ token }: { token: string }) {
  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [whatsapp, setWhatsapp] = useState("");
  const [waDisplay, setWaDisplay] = useState("");
  const [waValid, setWaValid] = useState<boolean | null>(null);
  const [slug, setSlug] = useState("");
  const [layout, setLayout] = useState<TemplateLayout>("cardA");
  const [primary, setPrimary] = useState("#0A66FF");
  const [accent, setAccent] = useState("#4FB0FF");
  const [bio, setBio] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);

  // extras
  const [extras, setExtras] = useState<ExtraRow[]>([]);
  const usedUnique = useMemo(
    () =>
      new Set(
        extras.map((e) => e.kind).filter((k) => k !== "otro") as Exclude<
          ExtraKind,
          "otro"
        >[]
      ),
    [extras]
  );
  const canAddExtra = extras.length < 3;

  // Load profile por token
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `/api/profile/by-token?token=${encodeURIComponent(token)}`
        );
        const json = await res.json();
        if (!json?.ok) {
          setError(json?.error || "Token inválido");
          setLoading(false);
          return;
        }
        const p = json.profile;
        setName(p.name || "");
        setLast(p.last_name || "");
        setEmail(p.email || "");
        setEmailValid(p.email ? emailSchema.safeParse(p.email).success : null);
        setWhatsapp(p.whatsapp || "");
        setWaDisplay(maskWhatsappDisplay(p.whatsapp || ""));
        setWaValid(!!p.whatsapp);
        setSlug(p.slug || "");
        const cfg = p.template_config || {};
        setLayout(cfg.layout || "cardA");
        setPrimary(cfg.brand?.primary || "#0A66FF");
        setAccent(cfg.brand?.accent || "#4FB0FF");
        setBio(cfg.bio || "");
        setPhotoDataUrl(cfg.photoDataUrl || null);
        const ex = (cfg.extras || []) as Array<{
          kind: ExtraKind;
          label?: string;
          value: string;
        }>;
        setExtras(
          ex.map((e, i) => ({
            id: `${Date.now()}-${i}`,
            kind: e.kind,
            label:
              e.label ||
              (e.kind !== "otro"
                ? KIND_LABEL[e.kind as Exclude<ExtraKind, "otro">]
                : ""),
            value: e.value,
          }))
        );
      } catch (e: any) {
        setError(e?.message || "Error cargando datos");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  function onEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value.toLowerCase();
    setEmail(v);
    setEmailValid(emailSchema.safeParse(v).success);
  }
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

  function updateExtra(id: string, patch: Partial<ExtraRow>) {
    setExtras((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              ...patch,
              ...(patch.kind && patch.kind !== "otro"
                ? {
                    label: KIND_LABEL[patch.kind as Exclude<ExtraKind, "otro">],
                  }
                : {}),
            }
          : e
      )
    );
  }
  function addExtra() {
    if (!canAddExtra) return;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const first =
      (["direccion", "instagram", "facebook", "tiktok", "x"] as const).find(
        (k) => !usedUnique.has(k)
      ) ?? "otro";
    setExtras((prev) => [
      ...prev,
      {
        id,
        kind: first as any,
        label: first === "otro" ? "" : KIND_LABEL[first],
        value: "",
      },
    ]);
  }
  function removeExtra(id: string) {
    setExtras((prev) => prev.filter((e) => e.id !== id));
  }

  async function onSave() {
    if (saving) return;
    if (!name.trim() || !last.trim()) {
      alert("Nombre y apellido son obligatorios");
      return;
    }
    if (email && !emailValid) {
      alert("Email inválido");
      return;
    }
    if (waValid === false) {
      alert("WhatsApp inválido");
      return;
    }

    setSaving(true);
    try {
      const { e164 } = normalizeWhatsapp(whatsapp);
      const template_config = {
        layout,
        brand: { primary, accent },
        bio: bio || undefined,
        photoDataUrl: photoDataUrl || undefined,
        extras: extras
          .map((it) => ({
            kind: it.kind,
            label:
              it.kind === "otro"
                ? it.label?.trim() || "Dato"
                : KIND_LABEL[it.kind as Exclude<ExtraKind, "otro">],
            value: it.value.trim(),
          }))
          .filter((x) => x.value.length > 0),
      };

      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          name: capitalizeWords(name),
          last_name: capitalizeWords(last),
          email: email || null,
          whatsapp: e164 || null,
          template_config,
        }),
      });
      const json = await res.json();
      if (!json?.ok) {
        alert(json?.error || "No se pudo guardar");
        setSaving(false);
        return;
      }
      // Éxito: ir a preview con el mismo token
      window.location.href = `/preview/${encodeURIComponent(
        json.slug
      )}?edit=${encodeURIComponent(token)}`;
    } catch (e: any) {
      alert(e?.message || "Error de red");
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <p className="text-sm text-gray-600">Cargando editor…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <h1 className="font-bold mb-2">No se pudo abrir el editor</h1>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#ffbb00] to-[#ffc833]">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h1 className="text-2xl font-black text-center">Editar WOWKard</h1>

          <div className="mt-6 grid gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                className="rounded-xl ring-1 ring-black/10 px-3 py-2"
                placeholder="Nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                className="rounded-xl ring-1 ring-black/10 px-3 py-2"
                placeholder="Apellido"
                value={last}
                onChange={(e) => setLast(e.target.value)}
              />
            </div>

            {/* Slug (bloqueado) */}
            <div className="text-sm">
              <div className="text-slate-700 mb-1 text-center">Tu URL es:</div>
              <div className="flex items-center gap-2">
                <span className="text-slate-700">https://mi.wowkard.es/</span>
                <input
                  className="rounded-lg ring-1 ring-black/10 px-2 py-1 text-center flex-1 bg-slate-100"
                  value={normalizeSlug(slug)}
                  readOnly
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                El <b>slug</b> no se puede cambiar desde el editor.
              </p>
            </div>

            <div className="grid gap-3">
              <input
                className="rounded-xl ring-1 ring-black/10 px-3 py-2"
                placeholder="Email"
                value={email}
                onChange={onEmailChange}
              />
              <input
                className="rounded-xl ring-1 ring-black/10 px-3 py-2"
                placeholder="WhatsApp"
                value={waDisplay}
                onChange={onWhatsappChange}
                onBlur={onWhatsappBlur}
              />
            </div>

            <textarea
              className="rounded-xl ring-1 ring-black/10 px-3 py-2"
              rows={3}
              placeholder="Mini bio (opcional)"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />

            <div>
              <label className="text-sm block mb-1">Diseño de tarjeta</label>
              <select
                className="rounded-xl ring-1 ring-black/10 px-3 py-2 w-full"
                value={layout}
                onChange={(e) => setLayout(e.target.value as TemplateLayout)}
              >
                {["cardA", "cardB", "cardC"].map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm block mb-1">Color primario</label>
                <input
                  type="color"
                  className="h-10 w-full p-1 bg-white rounded-xl ring-1 ring-black/10"
                  value={primary}
                  onChange={(e) => setPrimary(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm block mb-1">Color acento</label>
                <input
                  type="color"
                  className="h-10 w-full p-1 bg-white rounded-xl ring-1 ring-black/10"
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                />
              </div>
            </div>

            {/* Extras */}
            <div className="space-y-2">
              <label className="text-sm block">Otros datos (máx. 3)</label>
              {extras.map((row) => {
                const used = new Set(
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
                      className="col-span-4 rounded-xl ring-1 ring-black/10 px-3 py-2"
                      value={row.kind}
                      onChange={(e) =>
                        updateExtra(row.id, { kind: e.target.value as any })
                      }
                    >
                      {UNIQUE_KINDS.map((k) => (
                        <option key={k} value={k} disabled={used.has(k)}>
                          {KIND_LABEL[k]}
                        </option>
                      ))}
                      <option value="otro">Otro</option>
                    </select>
                    {row.kind === "otro" && (
                      <input
                        className="col-span-3 rounded-xl ring-1 ring-black/10 px-3 py-2"
                        placeholder="Etiqueta"
                        value={row.label}
                        onChange={(e) =>
                          updateExtra(row.id, { label: e.target.value })
                        }
                      />
                    )}
                    <input
                      className={`${
                        row.kind === "otro" ? "col-span-4" : "col-span-7"
                      } rounded-xl ring-1 ring-black/10 px-3 py-2`}
                      placeholder="Valor"
                      value={row.value}
                      onChange={(e) =>
                        updateExtra(row.id, { value: e.target.value })
                      }
                    />
                    <button
                      type="button"
                      className="col-span-1 rounded-xl ring-1 ring-black/10 px-3 py-2"
                      onClick={() => removeExtra(row.id)}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
              <button
                type="button"
                disabled={!canAddExtra}
                className="w-full rounded-xl border-2 border-dashed py-3"
                onClick={addExtra}
              >
                {canAddExtra ? "Agregar otros datos" : "Límite de 3 alcanzado"}
              </button>
            </div>

            {/* Foto (solo mantener/quitar) */}
            {photoDataUrl && (
              <div className="mt-2">
                <img
                  src={photoDataUrl}
                  alt="preview"
                  className="w-24 h-24 rounded-full object-cover border"
                />
                <button
                  type="button"
                  className="ml-3 text-sm underline"
                  onClick={() => setPhotoDataUrl(null)}
                >
                  Quitar foto
                </button>
              </div>
            )}
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <a
              href={`/preview/${encodeURIComponent(
                slug
              )}?edit=${encodeURIComponent(token)}`}
              className="text-center rounded-full bg-white text-black px-4 py-3 font-semibold ring-1 ring-black/10 hover:bg-gray-50"
            >
              Cancelar
            </a>
            <button
              onClick={onSave}
              disabled={saving}
              className="rounded-full bg-[#FFC62E] text-black px-4 py-3 font-semibold shadow-[inset_0_-2px_0_rgba(0,0,0,.18)] hover:brightness-105"
            >
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
