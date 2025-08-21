import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mi Sede WOW! — Prelanzamiento",
  description:
    "Prelanzamiento de Mi Sede WOW! Contáctanos por WhatsApp para activar tu sede.",
  openGraph: {
    title: "Mi Sede WOW!",
    description: "Prelanzamiento",
    url: "https://mi.sedewow.es",
  },
};

export default function Home() {
  const waHref =
    "https://wa.me/573234474483?text=Hola%2C%20entr%C3%A9%20a%20tu%20p%C3%A1gina%20web%20y%20quiero%20tener%20mi%20mi%20sede%20WOW%21";

  return (
    <main className="min-h-screen bg-amber-300">
      <div className="flex items-center justify-center min-h-screen p-6">
        <section className="w-full max-w-xl rounded-3xl bg-white/80 backdrop-blur ring-1 ring-black/5 shadow-xl p-8 text-center">
          <p className="text-xl tracking-wide text-neutral-500 mb-3">
            Bienvenidos a
          </p>

          <div className="mx-auto mb-6">
            <Image
              src="/brand/misede-wow-logo.png"
              alt="Logo Mi Sede WOW!"
              width={700}
              height={400}
              priority
              className="mx-auto h-auto w-full max-w-[420px]"
            />
          </div>

          <p className="text-xl text-neutral-700 leading-relaxed">
            <strong>Estamos en prelanzamiento.</strong>{" "}
          </p>
          <p className="text-sm">
            Por el momento no puedes reclamar tú mismo tu Sede WOW (muy pronto
            podrás hacerlo). Por ahora, contáctanos y te ayudamos a activarla.
          </p>

          <div className="mt-8">
            <Link
              href={waHref}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-base font-semibold text-white bg-[#25D366] hover:bg-[#1ebe57] border-2 border-white shadow-[0_5px_12px_rgba(0,0,0,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              {/* Icono blanco usando mask (no requiere modificar el SVG) */}
              <span
                aria-hidden="true"
                className="w-5 h-5 bg-white
                  [mask-image:url('/icons/whatsapp.svg')]
                  [mask-size:contain] [mask-repeat:no-repeat] [mask-position:center]
                  [-webkit-mask-image:url('/icons/whatsapp.svg')]
                  [-webkit-mask-size:contain] [-webkit-mask-repeat:no-repeat] [-webkit-mask-position:center]"
              />
              Quiero mi Sede WOW!
            </Link>
          </div>

          <p className="mt-4 text-xs text-neutral-500 mt-2">
            Estamos teniendo mucha demanda; gracias por tu comprensión <br />
            si no respondemos de inmediato. ¡Te atenderemos lo antes posible!
          </p>
        </section>
      </div>
    </main>
  );
}
