// src/app/layout.tsx
import type { Metadata } from "next";
import { Roboto_Condensed, Poppins } from "next/font/google";
import "./globals.css";

// Roboto Condensed: para títulos, nombre, cargo, bio, etc.
const rc = Roboto_Condensed({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "800", "900"], // tenemos medium, bold/black si hace falta
  variable: "--font-rc",
  display: "swap",
});

// Poppins: para textos de botones/labels que quieras en Poppins
const pop = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-pop",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mi Sede WOW!",
  description: "Tu sede digital, la que más vende",
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png", sizes: "32x32" }, // generado desde app/icon.png
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${rc.variable} ${pop.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
