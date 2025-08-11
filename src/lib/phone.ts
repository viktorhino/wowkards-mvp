// Reglas simples para E.164 (8–15 dígitos) y defaults para CO (+57)
export function normalizeWhatsapp(input: string, defaultCC = "+57") {
  let s = (input || "").trim();

  // Quitar espacios y símbolos salvo + (permitimos "00" → "+")
  s = s.replace(/[^\d+]/g, "");
  if (s.startsWith("00")) s = `+${s.slice(2)}`;

  // Si ya viene con +, usamos tal cual
  if (s.startsWith("+")) {
    const digits = s.replace(/\D/g, "");
    const e164 = `+${digits}`;
    const valid = digits.length >= 8 && digits.length <= 15;
    return { e164, valid, reason: valid ? "" : "longitud" };
  }

  // Sin + : detectamos si ya trae el indicativo 57 al inicio (ej. "573001234567")
  let digits = s.replace(/\D/g, "");

  if (digits.startsWith("57")) {
    const e164 = `+${digits}`;
    const valid = digits.length >= 8 && digits.length <= 15;
    return { e164, valid, reason: valid ? "" : "longitud" };
  }

  // Si no, asumimos país por defecto y quitamos ceros a la izquierda (ej. "00300...","0300...")
  digits = digits.replace(/^0+/, "");
  const e164 = `${defaultCC}${digits}`;
  const all = e164.replace(/\D/g, "");
  const valid = all.length >= 8 && all.length <= 15;
  return { e164, valid, reason: valid ? "" : "longitud" };
}
