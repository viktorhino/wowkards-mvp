export type TemplateKey =
  | "TemplateLinkBio"
  | "TemplateCatalogo"
  | "TemplateFormulario"
  | "TemplateEvento"
  | "TemplateFidelizacion";

// Usamos `unknown` para props y forzamos el tipo con `as` para evitar chequeo estricto
export const templateRegistry: Record<
  TemplateKey,
  () => Promise<{ default: unknown }>
> = {
  TemplateLinkBio: () =>
    import("@/templates/TemplateLinkBio/component") as Promise<{
      default: unknown;
    }>,
  TemplateCatalogo: () =>
    import("@/templates/TemplateLinkBio/component") as Promise<{
      default: unknown;
    }>,
  TemplateFormulario: () =>
    import("@/templates/TemplateLinkBio/component") as Promise<{
      default: unknown;
    }>,
  TemplateEvento: () =>
    import("@/templates/TemplateLinkBio/component") as Promise<{
      default: unknown;
    }>,
  TemplateFidelizacion: () =>
    import("@/templates/TemplateLinkBio/component") as Promise<{
      default: unknown;
    }>,
};
