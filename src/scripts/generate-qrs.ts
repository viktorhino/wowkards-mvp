import { existsSync, mkdirSync } from "fs";
import { URL } from "url";
import * as QRCode from "qrcode";

const BASE = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
const OUT = "public/qr";

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

async function make(code: string) {
  const url = new URL(`/${code}`, BASE).toString();
  const path = `${OUT}/${code}.png`;
  await QRCode.toFile(path, url, { margin: 1, scale: 6 });
  console.log("QR generado:", path);
}

async function main() {
  const codes = process.argv.slice(2);
  if (!codes.length) {
    console.error("Uso: pnpm gen:qrs abc1 abc2 ... (o setea lista de códigos)");
    process.exit(1);
  }
  for (const c of codes) await make(c);
}

main();
