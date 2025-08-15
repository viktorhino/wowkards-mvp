"use client";
import React from "react";
import type { PublicProfile, TemplateLayout } from "@/templates/types";
import CardA from "./variants/CardA";
import CardB from "./variants/CardB";
import CardC from "./variants/CardC";

export default function TemplateLinkBio({
  profile,
}: {
  profile: PublicProfile;
}) {
  const layout: TemplateLayout =
    (profile.template_config?.layout as TemplateLayout) || "cardA";

  switch (layout) {
    case "cardB":
      return <CardB profile={profile} />;
    case "cardC":
      return <CardC profile={profile} />;
    case "cardA":
    default:
      return <CardA profile={profile} />;
  }
}
