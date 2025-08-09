type LinkItem = { label: string; href: string };

type Profile = {
  name: string;
  last_name: string;
  whatsapp?: string | null;
  email?: string | null;
  instagram?: string | null;
  template_config?: {
    links?: LinkItem[];
  } | null;
};

export default function TemplateLinkBio({ profile }: { profile: Profile }) {
  const cfg = profile?.template_config ?? {};
  const links: LinkItem[] = cfg.links ?? [
    {
      label: "WhatsApp",
      href: profile?.whatsapp
        ? `https://wa.me/${String(profile.whatsapp).replace(/\D/g, "")}`
        : "#",
    },
    {
      label: "Instagram",
      href: profile?.instagram
        ? `https://instagram.com/${profile.instagram}`
        : "#",
    },
    {
      label: "Email",
      href: profile?.email ? `mailto:${profile.email}` : "#",
    },
  ];

  return (
    <main className="min-h-screen flex flex-col items-center p-8 gap-4">
      <h1 className="text-2xl font-bold">
        {profile?.name} {profile?.last_name}
      </h1>
      <ul className="w-full max-w-md flex flex-col gap-3">
        {links.map((l: LinkItem, i: number) => (
          <a
            key={i}
            className="rounded-2xl border p-4 text-center hover:shadow"
            href={l.href}
            target="_blank"
          >
            {l.label}
          </a>
        ))}
      </ul>
    </main>
  );
}
