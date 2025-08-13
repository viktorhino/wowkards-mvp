// src/app/edit/[token]/page.tsx
import { use } from "react";
import EditByToken from "./EditByToken";

type Params = { token: string };

export default function Page({ params }: { params: Promise<Params> }) {
  const { token } = use(params); // Next 15: params es Promise
  return <EditByToken token={token} />;
}
