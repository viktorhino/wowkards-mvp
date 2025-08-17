"use client";
import React from "react";
import Image from "next/image";
import { getPalette, PublicProfile } from "@/templates/types";

export default function CardC({ profile }: { profile: PublicProfile }) {
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
      <div className="relative h-40" style={{ background: primary }}>
        <svg
          className="absolute bottom-0 left-0 w-full"
          height="64"
          viewBox="0 0 800 200"
          preserveAspectRatio="none"
        >
          <path
            d="M0,160 L800,64 L800,200 L0,200 Z"
            fill="#fff"
            opacity="0.95"
          />
        </svg>
        <div className="absolute left-6 top-6 w-24 h-24 rounded-full ring-4 ring-white overflow-hidden bg-white">
          <Image
            src={profile.avatar_url || "/defaults/avatar-placeholder.png"}
            alt={full}
            width={96}
            height={96}
            className="w-full h-full object-cover"
            unoptimized
            priority
          />
        </div>
      </div>

      <div className="px-6 -mt-6">
        <div className="text-2xl font-bold">{full}</div>
        {posCompany && (
          <div className="text-sm text-gray-600">{posCompany}</div>
        )}
        {profile.mini_bio && (
          <div className="mt-2 text-sm text-gray-700">{profile.mini_bio}</div>
        )}
      </div>

      <div className="px-6 mt-4 space-y-3">
        {actions.map((b, i) =>
          b.href ? (
            <a
              key={i}
              href={b.href}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full block text-center font-semibold py-3 rounded-full text-white"
              style={{ background: primary }}
            >
              {b.label}
            </a>
          ) : (
            <button
              key={i}
              className="w-full block text-center font-semibold py-3 rounded-full text-white opacity-50 cursor-not-allowed"
              style={{ background: primary }}
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
          className="w-full block rounded-full bg-gray-100 text-gray-900 py-3 font-semibold text-center"
        >
          Save to contacts
        </a>
      </div>
    </div>
  );
}
