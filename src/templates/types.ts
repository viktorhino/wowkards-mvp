// Variantes disponibles para la familia LinkBio
export type TemplateLayout = "cardA" | "cardB" | "cardC";

export type TemplateBrand = {
  primary?: string; // color principal (fondos/énfasis)
  accent?: string; // color secundario/acento
};

// Item genérico para extras (instagram, facebook, tiktok, x, dirección, website, etc.)
export type ExtraItem = {
  kind?: string; // "instagram" | "facebook" | "tiktok" | "x" | "direccion" | "website" | ...
  label?: string; // Texto visible (ej: "INSTAGRAM")
  value?: string; // Valor (ej: "@usuario", URL, dirección, etc.)
};

export type TemplateConfig = {
  layout?: TemplateLayout; // default: 'cardA'
  brand?: TemplateBrand; // colores de la tarjeta
  extras?: ExtraItem[]; // lista de extras a renderizar como badges
};

// Perfil público mínimo que consumen las plantillas
export type PublicProfile = {
  slug?: string;
  name?: string;
  last_name?: string;
  position?: string;
  company?: string;
  mini_bio?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  avatar_url?: string;
  template_config: TemplateConfig;
};

// Claves del registry (compatibles con lo que usamos en page/[slug])
export type TemplateKey = "TemplateLinkBio" | "CardA" | "CardB" | "CardC";

// Defaults visuales
export const DEFAULT_TEMPLATE_CONFIG: TemplateConfig = {
  layout: "cardA",
  brand: { primary: "#0A66FF", accent: "#4FB0FF" },
};

// Helper de paleta (usado por CardA/CardB)
export function getPalette(cfg?: TemplateConfig) {
  const primary =
    cfg?.brand?.primary || DEFAULT_TEMPLATE_CONFIG.brand!.primary!;
  const accent = cfg?.brand?.accent || DEFAULT_TEMPLATE_CONFIG.brand!.accent!;
  return { primary, accent };
}
