import type { TemplateKey } from "@/templates/types";

// Registry de plantillas.
// - Mantenemos "TemplateLinkBio" por compatibilidad, apuntando a CardA.
// - Añadimos "CardA" y "CardB" explícitamente.
// - "CardC" por ahora fallback a CardA (para no romper si aún no existe).

type Loader = () => Promise<{ default: React.ComponentType<any> }>;

export const templateRegistry: Record<TemplateKey, Loader> = {
  TemplateLinkBio: () =>
    import("./TemplateLinkBio/variants/CardA") as Promise<{
      default: React.ComponentType<any>;
    }>,

  CardA: () =>
    import("./TemplateLinkBio/variants/CardA") as Promise<{
      default: React.ComponentType<any>;
    }>,

  CardB: () =>
    import("./TemplateLinkBio/variants/CardB") as Promise<{
      default: React.ComponentType<any>;
    }>,

  // Fallback mientras no exista CardC.tsx:
  CardC: () =>
    import("./TemplateLinkBio/variants/CardA") as Promise<{
      default: React.ComponentType<any>;
    }>,
};
