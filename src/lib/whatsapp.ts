// src/lib/whatsapp.ts
export type WaMsgOpts = {
  fullName?: string;
  publicUrl: string; // URL pública de la card
  editUrl?: string; // URL de edición por token (opcional)
};

export function buildCongratsPreviewMsg({
  fullName,
  publicUrl,
  editUrl,
}: WaMsgOpts) {
  // Negritas con *...* (formato WhatsApp) y saltos de línea
  const lines: string[] = [
    `¡Hola ${fullName || ""}, *Felicitaciones!* 🎉🎊`,
    `*Tu W🤩W Kard está lista!!* 🪪`,
    "",
    `👁️ *Puedes verla y compartirla en:*`,
    publicUrl,
  ];

  if (editUrl) {
    lines.push("", `✏️ *Si quieres corregirle algo:*`, editUrl);
  }

  lines.push(
    "",
    `*Ahora para terminar el proceso, sólo dos pasos más* (te toma 1 minuto):`,
    "",
    `1️⃣ *Suscríbete a nuestro canal en YouTube:* 📺`,
    `https://www.youtube.com/@EMPRENDEDORESWOW`,
    "",
    `2️⃣ *Suscríbete a nuestra comunidad:* 👥`,
    `https://www.skool.com/emprendedores-wow-4633`
  );

  return lines.join("\n");
}
