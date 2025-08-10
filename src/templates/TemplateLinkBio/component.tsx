type LinkItem = { label: string; href: string };
type Cfg = {
  links?: LinkItem[];
  avatar_url?: string | null;
  header_url?: string | null;
  cover_url?: string | null;
};
type Profile = {
  name: string;
  last_name: string;
  whatsapp?: string | null;
  email?: string | null;
  template_config?: Cfg | null;
};

export default function TemplateLinkBio({ profile }: { profile: Profile }) {
  const cfg: Cfg = profile?.template_config ?? {};

  const avatar = cfg.avatar_url || "/defaults/avatar.png";
  const header = cfg.header_url || "/defaults/header.png";
  const cover = cfg.cover_url || "/defaults/cover.jpg";

  const links: LinkItem[] =
    cfg.links ??
    ([
      profile.whatsapp
        ? {
            label: "WhatsApp",
            href: `https://wa.me/${String(profile.whatsapp).replace(
              /\D/g,
              ""
            )}`,
          }
        : null,
      profile.email
        ? { label: "Email", href: `mailto:${profile.email}` }
        : null,
    ].filter(Boolean) as LinkItem[]);

  return (
    <main className="min-h-screen flex flex-col items-center p-0">
      <div
        className="w-full h-40 md:h-56 bg-cover bg-center"
        style={{ backgroundImage: `url(${cover})` }}
      />
      <div className="w-full max-w-md -mt-12 flex flex-col items-center p-4 gap-3">
        <img
          src={avatar}
          alt="avatar"
          className="w-24 h-24 rounded-full border-4 border-white shadow"
        />
        <img src={header} alt="header" className="w-full rounded-xl" />
        <h1 className="text-2xl font-bold text-center">
          {profile.name} {profile.last_name}
        </h1>
        <ul className="w-full max-w-md flex flex-col gap-3 p-4">
          {links.map((l, i) => (
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
      </div>
    </main>
  );
}
