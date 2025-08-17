// src/templates/registry.ts
/*import type React from "react";

// evita `any` aquí:
type LazyComp = Promise<{
  default: React.ComponentType<Record<string, unknown>>;
}>;

const registry = {
  TemplateLinkBio: (): LazyComp => import("./TemplateLinkBio/variants/CardA"),
  CardA: (): LazyComp => import("./TemplateLinkBio/variants/CardA"),
  CardB: (): LazyComp => import("./TemplateLinkBio/variants/CardB"),
  // si tienes CardC real, cambia la ruta; si no, puedes dejar CardA
  CardC: (): LazyComp => import("./TemplateLinkBio/variants/CardA"),
} as const;

export default registry;
*/

import type React from "react";
import type { PublicProfile } from "./types";

// Las Cards reciben siempre { profile: PublicProfile }
type TemplateProps = { profile: PublicProfile };
type TemplateComponent = React.ComponentType<TemplateProps>;
type Loader = () => Promise<TemplateComponent>;

/**
 * Registro de componentes de templates (lazy).
 * Nota: usamos imports relativos para evitar problemas con alias.
 */
export const registry = {
  cardA: () =>
    import("./TemplateLinkBio/variants/CardA").then(
      (m) => m.default as TemplateComponent
    ),
  cardB: () =>
    import("./TemplateLinkBio/variants/CardB").then(
      (m) => m.default as TemplateComponent
    ),
  cardC: () =>
    import("./TemplateLinkBio/variants/CardC").then(
      (m) => m.default as TemplateComponent
    ),
} satisfies Record<string, Loader>;

// Helper opcional para resolver por clave con fallback
export async function loadTemplate(key?: string) {
  const k = (key || "cardA") as keyof typeof registry;
  const loader = registry[k] || registry.cardA;
  return loader();
}

export type TemplateKey = keyof typeof registry;
export type { TemplateProps, TemplateComponent, Loader };
