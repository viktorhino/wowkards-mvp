"use client";
import React from "react";
import { getPalette, PublicProfile } from "@/templates/types";

function cleanPhone(p?: string) {
  return (p || "").replace(/\D/g, "");
}

export default function CardA({ profile }: { profile: PublicProfile }) {
  const { primary } = getPalette(profile.template_config);
  const full =
    `${profile.name ?? ""} ${profile.last_name ?? ""}`.trim() ||
    "Your Full Name";
  const posCompany = [profile.position, profile.company]
    .filter(Boolean)
    .join(" - ");
  const phone = cleanPhone(profile.whatsapp);
  const waHref = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(`Hola ${full}`)}`
    : undefined;

  return (
    <div className="w-full max-w-sm mx-auto rounded-3xl overflow-hidden shadow-lg bg-white">
      <div className="relative p-6 text-white" style={{ background: primary }}>
        <div className="w-24 h-24 rounded-full ring-4 ring-white mx-auto overflow-hidden bg-white">
          <img
            src={profile.avatar_url || "/defaults/avatar-placeholder.png"}
            alt={full}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="mt-4 text-center">
          <div className="text-xl font-bold leading-tight">{full}</div>
          {posCompany && <div className="opacity-90 text-sm">{posCompany}</div>}
        </div>
      </div>

      {profile.mini_bio && (
        <div className="p-5 text-center text-sm text-gray-700">
          {profile.mini_bio}
        </div>
      )}

      <div className="px-5 pb-4 grid grid-cols-3 gap-3">
        {waHref ? (
          <a
            href={waHref}
            className="rounded-xl py-3 text-center font-medium text-white"
            style={{ background: primary }}
            target="_blank"
            rel="noopener noreferrer"
          >
            Phone
          </a>
        ) : (
          <button
            className="rounded-xl py-3 text-center font-medium text-white opacity-50 cursor-not-allowed"
            style={{ background: primary }}
          >
            Phone
          </button>
        )}
        {profile.email ? (
          <a
            href={`mailto:${profile.email}`}
            className="rounded-xl py-3 text-center font-medium text-white"
            style={{ background: primary }}
          >
            Email
          </a>
        ) : (
          <button
            className="rounded-xl py-3 text-center font-medium text-white opacity-50 cursor-not-allowed"
            style={{ background: primary }}
          >
            Email
          </button>
        )}
        {profile.website ? (
          <a
            href={profile.website}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl py-3 text-center font-medium text-white"
            style={{ background: primary }}
          >
            Website
          </a>
        ) : (
          <button
            className="rounded-xl py-3 text-center font-medium text-white opacity-50 cursor-not-allowed"
            style={{ background: primary }}
          >
            Website
          </button>
        )}
      </div>

      <div className="px-5 pb-5">
        <div className="bg-gray-50 rounded-2xl divide-y">
          {phone && (
            <div className="p-4 text-sm">
              <div className="text-gray-500">Mobile Phone (Work)</div>
              <div className="font-medium">
                +{phone.startsWith("+") ? phone.slice(1) : phone}
              </div>
            </div>
          )}
          {profile.email && (
            <div className="p-4 text-sm">
              <div className="text-gray-500">Email</div>
              <div className="font-medium">{profile.email}</div>
            </div>
          )}
          {profile.website && (
            <div className="p-4 text-sm">
              <div className="text-gray-500">Website</div>
              <div className="font-medium break-all">{profile.website}</div>
            </div>
          )}
        </div>
      </div>

      <div className="p-5 pt-0">
        <a
          href={`data:text/vcard;charset=utf-8,${encodeURIComponent(
            [
              "BEGIN:VCARD",
              "VERSION:3.0",
              `FN:${full}`,
              profile.email ? `EMAIL;TYPE=INTERNET:${profile.email}` : "",
              phone
                ? `TEL;TYPE=CELL:+${
                    phone.startsWith("+") ? phone.slice(1) : phone
                  }`
                : "",
              profile.website ? `URL:${profile.website}` : "",
              "END:VCARD",
            ]
              .filter(Boolean)
              .join("\n")
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
