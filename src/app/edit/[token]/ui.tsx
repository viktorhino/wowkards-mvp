"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

type ExtraItem = { type: string; value: string };

type TemplateConfig = {
  extra?: ExtraItem[];
  avatar_url?: string | null;
} & Record<string, unknown>;

type Profile = {
  id: string;
  slug: string;
  name: string;
  last_name: string;
  whatsapp: string | null;
  email: string | null;
  mini_bio: string | null;
  template_config: TemplateConfig | null;
};

const EXTRA_OPTIONS = [
  { key: "direccion", label: "Dirección" },
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "tiktok", label: "TikTok" },
  { key: "x", label: "X (Twitter)" },
  { key: "otro", label: "Otro" },
];
const MAX_EXTRAS = 3;

const digits = (s: string) => s.replace(/\D/g, "");
const normalizeWhats = (raw: string, defaultCc = "57") => {
  const d = digits(raw || "");
  if (!d) return "";
  if (d.length >= 11) return `+${d}`;
  if (d.length === 10) return `+${defaultCc}${d}`;
  return `+${d}`;
};

const capitalizeWords = (s: string) =>
  (s || "")
    .trim()
    .toLocaleLowerCase("es-ES")
    .replace(
      /(^|\s|-)([\p{L}\p{M}])/gu,
      (_, sep: string, ch: string) => sep + ch.toLocaleUpperCase("es-ES")
    );

const usedTypes = (extras: ExtraItem[], except?: number) =>
  new Set(
    extras
      .map((e, i) => (i === except ? null : e.type))
      .filter(Boolean) as string[]
  );
const availableTypes = (extras: ExtraItem[], except?: number) =>
  EXTRA_OPTIONS.map((o) => o.key).filter(
    (k) => !usedTypes(extras, except).has(k)
  );

export default function EditClient({
  profile,
  token,
}: {
  profile: Profile;
  token: string;
}) {
  // Base
  const [name, setName] = useState(profile.name || "");
  const [last, setLast] = useState(profile.last_name || "");
  const [whatsapp, setWhatsapp] = useState(profile.whatsapp || "");
  const [email, setEmail] = useState(profile.email || "");
  const [miniBio, setMiniBio] = useState(profile.mini_bio || "");

  // Extras (desde template_config.extra)
  const initialExtras: ExtraItem[] = useMemo(
    () =>
      profile.template_config?.extra &&
      Array.isArray(profile.template_config.extra)
        ? profile.template_config.extra
        : [],
    [profile.template_config]
  );
  const [extras, setExtras] = useState<ExtraItem[]>(
    initialExtras.slice(0, MAX_EXTRAS)
  );
  const [extraErrors, setExtraErrors] = useState<boolean[]>(
    new Array(initialExtras.length).fill(false)
  );

  // Avatar (desde template_config.avatar_url)
  const initialAvatar = profile.template_config?.avatar_url || null;
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatar);
  const [fileAvatar, setFileAvatar] = useState<File | null>(null);

  // Estado
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [viewLink, setViewLink] = useState<string | null>(null);

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

  const handleAvatarFile = (f: File | null) => {
    setFileAvatar(f);
    if (f) {
      const url = URL.createObjectURL(f);
      setAvatarUrl(url);
    } else {
      setAvatarUrl(initialAvatar);
    }
  };

  // Sube archivo (si hay) y devuelve URL pública
  const uploadAvatarIfAny = async (f: File | null) => {
    if (!f) return initialAvatar || avatarUrl || null;
    const safeName = f.name.replace(/\s+/g, "-");
    const path = `${profile.slug}/avatar-${Date.now()}-${safeName}`;
    const { error } = await supabase.storage
      .from("profiles")
      .upload(path, f, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("profiles").getPublicUrl(path);
    return data.publicUrl || null;
  };

  const save = async () => {
    setSaving(true);
    setMsg(null);
    setViewLink(null);
    try {
      // Validación extras
      if (extras.some((e) => !e.value.trim())) {
        setExtraErrors(extras.map((e) => !e.value.trim()));
        throw new Error("Completa todos los “otros datos” o elimínalos.");
      }

      // Subir avatar si corresponde
      const newAvatarUrl = await uploadAvatarIfAny(fileAvatar);

      // template_config resultante
      const template_config: TemplateConfig = {
        ...(profile.template_config || {}),
        extra: extras,
        avatar_url: newAvatarUrl || null,
      };

      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          edit_token: token,
          name: capitalizeWords(name),
          last_name: capitalizeWords(last),
          whatsapp: normalizeWhats(whatsapp),
          email,
          mini_bio: miniBio.slice(0, 250),
          template_config,
        }),
      });
      const j = await res.json();

      if (!res.ok || !j.ok) throw new Error(j.error || "No se pudo actualizar");
      // Éxito: mensaje y link
      setMsg("Guardado");
      if (j.link) setViewLink(j.link as string);
      setFileAvatar(null);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "No se pudo actualizar.";
      setMsg(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="w-full max-w-md flex flex-col gap-3 border rounded-2xl p-5">
        <h1 className="text-xl font-bold">Editar mi WOWKard</h1>

        {/* Avatar actual / preview */}
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-full overflow-hidden border">
            <Image
              src={avatarUrl || "/defaults/avatar.png"}
              alt="avatar"
              width={64}
              height={64}
              className="w-16 h-16 rounded-full object-cover"
              unoptimized
              onError={() => setAvatarUrl("/defaults/avatar.png")}
            />
          </div>
          <div className="flex gap-2">
            <label className="px-3 py-2 border rounded-md cursor-pointer hover:bg-gray-50">
              Subir imagen
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleAvatarFile(e.target.files?.[0] || null)}
              />
            </label>
            <label className="px-3 py-2 border rounded-md cursor-pointer hover:bg-gray-50">
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
        </div>

        {/* Base */}
        <label className="flex flex-col gap-1">
          <span>Nombre</span>
          <input
            className="border rounded-md p-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span>Apellido</span>
          <input
            className="border rounded-md p-2"
            value={last}
            onChange={(e) => setLast(e.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span>WhatsApp</span>
          <input
            className="border rounded-md p-2"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span>Correo</span>
          <input
            className="border rounded-md p-2"
            value={email || ""}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span>Mini-biografía (máx. 250)</span>
          <textarea
            className="border rounded-md p-2"
            rows={3}
            maxLength={250}
            value={miniBio || ""}
            onChange={(e) => setMiniBio(e.target.value.slice(0, 250))}
          />
        </label>

        {/* Extras */}
        <div className="mt-2 flex flex-col gap-2">
          <div className="text-sm font-medium">Otros datos</div>
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
            Agregar otro dato
          </button>
        </div>

        {/* Mensaje + botón de ver */}
        {msg && (
          <div className="flex flex-col gap-2">
            <div className="text-sm">{msg}</div>
            {viewLink && (
              <a
                href={viewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-black text-white py-2 text-center"
              >
                Ver mi WOWKard
              </a>
            )}
          </div>
        )}

        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-black text-white py-2 disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}
