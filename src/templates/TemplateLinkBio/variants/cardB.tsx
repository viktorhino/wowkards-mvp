"use client";
import React from "react";
import { getPalette, PublicProfile } from "@/templates/types";

export default function CardB({ profile }: { profile: PublicProfile }) {
  const { primary } = getPalette(profile.template_config);
  const full =
    `${profile.name ?? ""} ${profile.last_name ?? ""}`.trim() ||
    "Your Full Name";
  const posCompany = [profile.position, profile.company]
    .filter(Boolean)
    .join(" - ");

  const phone = (profile.whatsapp || "").replace(/\D/g, "");
  const actions = [
    { label: "Phone", href: phone ? `https://wa.me/${phone}` : undefined },
    {
      label: "Email",
      href: profile.email ? `mailto:${profile.email}` : undefined,
    },
    { label: "Website", href: profile.website },
  ];

  return (
    <div className="w-full max-w-sm mx-auto rounded-3xl overflow-hidden shadow-lg bg-white">
      <div className="relative" style={{ background: primary }}>
        <div className="h-20" />
        <div className="absolute left-1/2 -bottom-12 -translate-x-1/2">
          <div className="w-24 h-24 rounded-full ring-4 ring-white overflow-hidden bg-white">
            <img
              src={profile.avatar_url || "/defaults/avatar-placeholder.png"}
              alt={full}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      <div className="pt-14 px-6 text-center">
        <div className="text-xl font-bold">{full}</div>
        {posCompany && (
          <div className="text-sm text-gray-600">{posCompany}</div>
        )}
        {profile.mini_bio && (
          <div className="mt-2 text-sm text-gray-700">{profile.mini_bio}</div>
        )}
      </div>

      <div className="px-6 mt-4 grid grid-cols-3 gap-3">
        {actions.map((b, i) =>
          b.href ? (
            <a
              key={i}
              href={b.href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl py-2 text-center font-medium border"
              style={{ borderColor: primary, color: primary }}
            >
              {b.label}
            </a>
          ) : (
            <button
              key={i}
              className="rounded-xl py-2 text-center font-medium border opacity-50 cursor-not-allowed"
              style={{ borderColor: primary, color: primary }}
            >
              {b.label}
            </button>
          )
        )}
      </div>

      <div className="px-6 py-5">
        <a
          href={`data:text/vcard;charset=utf-8,${encodeURIComponent(
            "BEGIN:VCARD\nVERSION:3.0\nFN:" + full + "\nEND:VCARD"
          )}`}
          download={`${full.replace(/\s+/g, "_")}.vcf`}
          className="w-full block rounded-full text-white text-center font-bold py-3"
          style={{ background: primary }}
        >
          Save to contacts
        </a>
      </div>
    </div>
  );
}
