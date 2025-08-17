// src/templates/registry.ts
import type React from "react";

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
