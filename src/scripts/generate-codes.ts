import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !service) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, service);

const ABC = "abcdefghjkmnpqrstuvwxyz23456789"; // sin 0,1,i,l,o
function genCode(n = 4) {
  let s = "";
  for (let i = 0; i < n; i++) s += ABC[Math.floor(Math.random() * ABC.length)];
  return s;
}

async function main() {
  const total = parseInt(process.argv[2] || "100", 10);
  const size = parseInt(process.argv[3] || "4", 10); // longitud
  const set = new Set<string>();

  while (set.size < total) set.add(genCode(size));

  const rows = [...set].map((code) => ({ code, status: "unclaimed" as const }));
  const { error } = await admin.from("short_codes").insert(rows);
  if (error) {
    console.error(error);
    process.exit(1);
  }
  console.log(`Insertados ${rows.length} códigos.`);
}

main();
