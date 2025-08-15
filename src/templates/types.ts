export type TemplateLayout = "cardA" | "cardB" | "cardC";

export type TemplateBrand = {
  primary?: string; // color de marca (botones/fondos)
  accent?: string; // color acento (bordes/detalles)
};

export type TemplateConfig = {
  layout?: TemplateLayout; // default: 'cardA'
  brand?: TemplateBrand; // defaults por si vienen vacíos
};

export const DEFAULT_TEMPLATE_CONFIG: TemplateConfig = {
  layout: "cardA",
  brand: { primary: "#0A66FF", accent: "#4FB0FF" },
};

export function getPalette(cfg?: TemplateConfig) {
  const primary =
    cfg?.brand?.primary || DEFAULT_TEMPLATE_CONFIG.brand!.primary!;
  const accent = cfg?.brand?.accent || DEFAULT_TEMPLATE_CONFIG.brand!.accent!;
  return { primary, accent };
}

// --- Tipado mínimo del perfil público que renderizan las plantillas ---
export type PublicProfile = {
  slug: string;
  name?: string;
  last_name?: string;
  position?: string;
  company?: string;
  mini_bio?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  avatar_url?: string;
  template_config?: TemplateConfig;
  // extras?: { type: string; label?: string; value: string }[]; // opcional
};
