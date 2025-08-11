"use client";

import { Profile } from "@/lib/types";

export default function TemplateLinkBio({ profile }: { profile: Profile }) {
  const layout = profile?.template_config?.layout || "cardA";

  if (layout === "cardA") {
    return <CardA profile={profile} />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Layout no soportado: {layout}</p>
    </div>
  );
}

function CardA({ profile }: { profile: Profile }) {
  const primary = profile?.template_config?.brand?.primary || "#0A66FF";
  const accent = profile?.template_config?.brand?.accent || "#4FB0FF";

  const bio = (profile?.template_config as any)?.bio as string | undefined;
  const photo = (profile?.template_config as any)?.photoDataUrl as
    | string
    | undefined;

  const links = profile?.links || [];

  return (
    <main
      className="flex flex-col items-center justify-start min-h-screen p-6"
      style={{
        background: `linear-gradient(135deg, ${primary} 0%, ${accent} 100%)`,
      }}
    >
      {/* Foto */}
      {photo && (
        <img
          src={photo}
          alt="avatar"
          className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
        />
      )}

      {/* Nombre */}
      <h1 className="text-2xl font-bold text-white mt-4">
        {profile?.name} {profile?.last_name}
      </h1>

      {/* Mini bio */}
      {bio && (
        <p className="text-sm text-white opacity-80 text-center mt-1 max-w-xs">
          {bio}
        </p>
      )}

      {/* Links */}
      <div className="mt-6 w-full max-w-sm space-y-3">
        {links.map((link, idx) => (
          <a
            key={idx}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center py-3 rounded-xl font-semibold bg-white text-gray-900 hover:opacity-90 transition"
          >
            {link.title}
          </a>
        ))}
      </div>
    </main>
  );
}
