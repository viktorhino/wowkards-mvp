// src/app/sede-wow/page.tsx
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/server";

export const metadata = {
  title: "Sede WOW | Crea tu WOWKard (1er mes gratis)",
  description:
    "Activa tu Sede WOW: tarjetas digitales para tu equipo, diseño pro y todo listo en minutos. Primer mes gratis.",
};

// ⚠️ Ajusta tu número de ventas aquí o con env var NEXT_PUBLIC_WAPP_SALES
const SALES_WAPP =
  process.env.NEXT_PUBLIC_WAPP_SALES?.replace(/\D/g, "") || "573234434426";
const WA_MSG =
  "Hola, quiero información para activar mi Sede WOW (vi la landing).";

async function createWithFreeCode() {
  "use server";

  const supabase = supabaseAdmin();

  // 1) Buscar un código libre
  const { data, error } = await supabase
    .from("short_codes")
    .select("code, status, claimed")
    .eq("claimed", false)
    .eq("status", "unclaimed") // si usas otro estado, cámbialo aquí
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  //console.log(data);

  if (error || !data) {
    // No hay códigos libres → manda al claim con un error legible
    redirect("/claim?error=no-codes");
  }

  // 2) (Opcional recomendado) Reservarlo un instante para evitar carreras.
  //    Si no tienes estado 'reserved', puedes saltarte esta parte.
  //await supabase
  //    .from("short_codes")
  //.update({ status: "reserved" })
  //.eq("id", data.id);

  // 3) Redirigir al claim con el código libre
  //redirect(`/claim?code=${encodeURIComponent(data.code)}`);
  redirect(`/${encodeURIComponent(data.code)}`);
}

export default async function SedeWOW() {
  const waUrl = `https://wa.me/${SALES_WAPP}?text=${encodeURIComponent(
    WA_MSG
  )}`;

  return (
    <main
      className="min-h-screen bg-cover bg-top"
      style={{ backgroundImage: "url(/background.jpg)" }}
    >
      <section className="max-w-[960px] mx-auto px-5 py-10 md:py-16">
        {/* HERO */}
        <div className="bg-white/95 rounded-3xl shadow-xl overflow-hidden">
          <div
            className="h-32 md:h-40 w-full"
            style={{ background: "linear-gradient(180deg,#ffcf3b,#ffb300)" }}
          />
          <div className="px-6 md:px-10 pb-8 md:pb-12 -mt-20 md:-mt-12">
            <h1 className="font-rc font-bold text-3xl md:text-4xl text-center mb-2">
              Activa tu <span className="whitespace-nowrap">Sede W🤩W</span>
            </h1>
            <p className="font-rc text-[#585858] text-center text-base md:text-lg">
              Tarjetas digitales para tu equipo, listas en minutos, con diseño
              profesional y métricas en tiempo real.{" "}
              <strong>¡Primer mes gratis!</strong>
            </p>

            {/* Bullets / beneficios */}
            <div className="grid md:grid-cols-3 gap-4 md:gap-6 mt-8">
              {[
                {
                  t: "Tarjetas WOWKards ilimitadas",
                  d: "Crea tarjetas para cada persona de tu sede, con foto, enlaces y llamada a la acción.",
                },
                {
                  t: "Diseños pro y personalización",
                  d: "Aplica tus colores y elige plantillas (Card A/B/C). Actualiza datos en segundos.",
                },
                {
                  t: "Comparte y mide",
                  d: "Compartible por WhatsApp, QR y link único. Control de estados y métricas.",
                },
              ].map((b, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-gray-100 p-4 md:p-5 bg-white"
                >
                  <h3 className="font-rc font-bold text-lg mb-1">{b.t}</h3>
                  <p className="font-rc text-[#585858] text-sm">{b.d}</p>
                </div>
              ))}
            </div>

            {/* Pricing strip */}
            <div className="mt-8 p-4 md:p-5 rounded-2xl bg-[#fff7da] border border-[#ffe8a6] text-center">
              <p className="font-rc text-[#585858] text-sm md:text-base">
                <strong>Prueba 30 días sin costo</strong>. Luego continúa desde{" "}
                <strong>USD 9/mes</strong> por sede. Cancela cuando quieras.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col md:flex-row gap-3 md:gap-4">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-pop inline-flex items-center justify-center rounded-2xl px-5 py-3 w-full md:w-1/2 text-white shadow-lg"
                style={{ background: "#25D366" }}
              >
                💬 Habla con un asesor
              </a>

              {/* Server Action: toma un código libre y redirige a /claim?code=... */}
              <form action={createWithFreeCode} className="w-full md:w-1/2">
                <button
                  type="submit"
                  className="font-pop inline-flex items-center justify-center rounded-2xl px-5 py-3 w-full text-white shadow-lg"
                  style={{ background: "#111" }}
                >
                  🚀 Crear mi WOWKard gratis
                </button>
              </form>
            </div>

            {/* FAQ breve */}
            <div className="mt-8 grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-rc font-bold">¿Necesito tarjeta física?</p>
                <p className="font-rc text-[#585858]">
                  No. Funcionan con link o QR. Si luego quieres NFC, podemos
                  integrarlo.
                </p>
              </div>
              <div>
                <p className="font-rc font-bold">¿Puedo cambiar el diseño?</p>
                <p className="font-rc text-[#585858]">
                  Sí. Cambias colores, foto y plantilla cuando quieras.
                </p>
              </div>
              <div>
                <p className="font-rc font-bold">¿Es realmente gratis?</p>
                <p className="font-rc text-[#585858]">
                  Sí, 30 días de prueba. No pedimos tarjeta para empezar.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
