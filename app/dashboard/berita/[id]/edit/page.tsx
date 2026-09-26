"use client";

import { useParams } from "next/navigation";
import BeritaEditor from "@/components/berita-editor";

export default function EditBeritaPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : null;
  return <BeritaEditor id={id} />;
}
