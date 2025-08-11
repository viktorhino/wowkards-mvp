import slugify from "slugify";

/**
 * Normaliza cualquier string a un slug válido (minúsculas, sin espacios raros).
 */
export const normalizeSlug = (s: string) =>
  slugify(s || "", { lower: true, strict: true });

/**
 * Sugerencia de slug: "nombre-apellido" (si falta uno, usa el otro).
 */
export const suggestSlug = (name: string, last: string) => {
  const base = [name, last].filter(Boolean).join("-"); // <- guion en medio
  return normalizeSlug(base);
};
