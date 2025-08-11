export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabaseClient";

type Params = { token: string };

export default async function Page({ params }: { params: Promise<Params> }) {
  const { token } = await params;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "id, slug, name, last_name, whatsapp, email, mini_bio, template_config, edit_token"
    )
    .eq("edit_token", token)
    .maybeSingle();

  if (error || !profile) {
    return <div className="p-6">Token inválido o perfil no encontrado.</div>;
  }

  const EditClient = (await import("./ui")).default;
  return <EditClient profile={profile} token={token} />;
}
