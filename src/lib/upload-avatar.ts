// Utilidad común para subir un avatar desde dataURL y obtener URL pública
import { createAdminClient } from "@/lib/supabase/admin";

export async function uploadAvatarFromDataUrl(
  dataUrl?: string,
  keyPrefix: string = "profiles"
): Promise<string | null> {
  if (!dataUrl || typeof dataUrl !== "string") return null;
  if (dataUrl.startsWith("http")) return dataUrl; // ya es URL

  const [meta, base64] = dataUrl.split(",");
  if (!base64 || !meta?.includes("base64")) return null;

  const mime = (
    meta.match(/^data:(.+);base64$/)?.[1] || "image/jpeg"
  ).toLowerCase();
  const ext = mime.includes("png")
    ? "png"
    : mime.includes("webp")
    ? "webp"
    : "jpg";

  const admin = createAdminClient();
  const bucket = "avatars"; // si tu bucket tiene otro nombre, cámbialo aquí
  const key = `${keyPrefix}/${Date.now()}.${ext}`;

  const buffer = Buffer.from(base64, "base64");
  const { error: upErr } = await admin.storage
    .from(bucket)
    .upload(key, buffer, {
      contentType: mime,
      upsert: true,
    });
  if (upErr) throw upErr;

  const { data } = admin.storage.from(bucket).getPublicUrl(key);
  return data?.publicUrl || null;
}
