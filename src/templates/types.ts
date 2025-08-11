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
