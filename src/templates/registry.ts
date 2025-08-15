/*export type TemplateKey =
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
};*/

import type { ComponentType } from "react";

export type TemplateKey =
  | "TemplateLinkBio"
  | "TemplateCatalogo"
  | "TemplateFormulario"
  | "TemplateEvento"
  | "TemplateFidelizacion";

// Cargador dinámico de cada template. Por ahora todos apuntan a TemplateLinkBio.
export const templateRegistry: Record<
  TemplateKey,
  () => Promise<{ default: ComponentType<any> }>
> = {
  TemplateLinkBio: () => import("@/templates/TemplateLinkBio/component"),
  TemplateCatalogo: () => import("@/templates/TemplateLinkBio/component"),
  TemplateFormulario: () => import("@/templates/TemplateLinkBio/component"),
  TemplateEvento: () => import("@/templates/TemplateLinkBio/component"),
  TemplateFidelizacion: () => import("@/templates/TemplateLinkBio/component"),
};
