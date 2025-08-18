// src/app/api/vcard/route.ts
import { NextRequest } from "next/server";

function safe(s?: string) {
  return (s || "").trim();
}

function fileSafe(s: string) {
  return s.replace(/[^\w.-]+/g, "_").slice(0, 60);
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const p = url.searchParams;

  // Parámetros
  const fullName = safe(p.get("fullName") ?? undefined);
  const phone = safe(p.get("phone") ?? undefined); // en formato internacional +57...
  const email = safe(p.get("email") ?? undefined);
  const org = safe(p.get("org") ?? undefined);
  const title = safe(p.get("title") ?? undefined);
  const website = safe(p.get("url") ?? undefined);
  const note = safe(p.get("note") ?? undefined);
  const photoUrl = safe(p.get("photo") ?? undefined); // URI a imagen (Supabase URL)

  if (!fullName) {
    return new Response("Missing fullName", { status: 400 });
  }

  // Nombre en N: Apellidos;Nombre;Segundo;Prefijo;Sufijo (dejamos FN y N básico)
  const parts = fullName.split(" ");
  const last = parts.length > 1 ? parts[parts.length - 1] : "";
  const first = parts.slice(0, -1).join(" ") || fullName;

  const lines = [
    "BEGIN:VCARD",
    "VERSION:4.0",
    `FN:${fullName}`,
    `N:${last};${first};;;`,
    org ? `ORG:${org}` : "",
    title ? `TITLE:${title}` : "",
    phone ? `TEL;TYPE=CELL:${phone}` : "",
    email ? `EMAIL;TYPE=INTERNET:${email}` : "",
    website ? `URL:${website}` : "",
    note ? `NOTE:${note}` : "",
    photoUrl ? `PHOTO;VALUE=URI:${photoUrl}` : "",
    "END:VCARD",
  ].filter(Boolean);

  const body = lines.join("\r\n");

  const filename = `${fileSafe(fullName)}.vcf`;
  return new Response(body, {
    status: 200,
    headers: {
      // Esto hace que iOS/Android lo abran como contacto
      "Content-Type": "text/x-vcard; charset=utf-8",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
