"use client";

import { useEffect, useRef, useState } from "react";
import { renderAsync } from "docx-preview";
import { generateSampleFilledDocx, downloadBlob } from "@/lib/letter-template";
import { Button } from "@/components/ui/button";
import { Download, FileWarning } from "lucide-react";

type Props = {
  templateBuffer: ArrayBuffer | null;
  placeholders: string[];
  customFields: { key: string; label: string }[];
  fileName?: string;
};

/**
 * Simulasi surat terisi data contoh, dirender semirip Word.
 * Gagal isi tampilkan template mentah; gagal render tampilkan error + tombol unduh.
 */
export default function LetterSimulationPreview({ templateBuffer, placeholders, customFields, fileName }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scalerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"idle" | "rendering" | "filled" | "raw" | "error">("idle");
  const [errorDetail, setErrorDetail] = useState("");
  const [filledBlob, setFilledBlob] = useState<Blob | null>(null);
  const [zoom, setZoom] = useState<"fit" | 50 | 75 | 100>("fit");

  const applyScale = () => {
    const outer = containerRef.current;
    const scaler = scalerRef.current;
    if (!outer || !scaler) return;
    const page = scaler.querySelector(".docx") as HTMLElement | null;
    if (!page) return;
    const pageWidth = page.offsetWidth || 1;
    const avail = outer.clientWidth || 1;
    const target = zoom === "fit" ? Math.min(1, avail / pageWidth) : zoom / 100;
    scaler.style.transform = `scale(${target})`;
    scaler.style.transformOrigin = "top left";
    scaler.style.width = `${pageWidth}px`;
    // transform tidak mengubah layout height, jadi set tinggi manual (dibatasi agar bisa scroll)
    outer.style.height = `${Math.min(scaler.scrollHeight * target + 8, 640)}px`;
  };

  useEffect(() => {
    applyScale();
    window.addEventListener("resize", applyScale);
    return () => window.removeEventListener("resize", applyScale);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, status]);

  useEffect(() => {
    if (!templateBuffer || placeholders.length === 0) {
      setStatus("idle");
      return;
    }
    let cancelled = false;
    const render = async () => {
      setStatus("rendering");
      setErrorDetail("");
      setFilledBlob(null);
      const el = scalerRef.current;
      if (el) el.innerHTML = "";

      let blobToRender: Blob;
      let usedFilled = true;
      try {
        blobToRender = await generateSampleFilledDocx(
          templateBuffer.slice(0),
          placeholders,
          customFields
        );
        if (!cancelled) setFilledBlob(blobToRender);
      } catch (fillErr) {
        console.warn("Isi contoh gagal, tampilkan template mentah:", fillErr);
        usedFilled = false;
        blobToRender = new Blob([templateBuffer.slice(0)], {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });
      }
      if (cancelled) return;

      try {
        if (!el) return;
        await renderAsync(blobToRender, el, undefined, {
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: true,
          breakPages: true,
          useBase64URL: true,
        } as unknown as Record<string, unknown>);
        if (!cancelled) {
          setStatus(usedFilled ? "filled" : "raw");
          // samakan lebar halaman ke kolom (fit) setelah DOM ter-render
          requestAnimationFrame(() => {
            if (!cancelled) applyScale();
          });
        }
      } catch (renderErr) {
        console.error("Gagal render simulasi:", renderErr);
        if (!cancelled) {
          setStatus("error");
          const msg = renderErr instanceof Error ? renderErr.message : String(renderErr);
          setErrorDetail(msg.slice(0, 300));
        }
      }
    };
    render();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateBuffer, placeholders]);

  const downloadScanned = () => {
    if (!templateBuffer) return;
    downloadBlob(
      new Blob([templateBuffer.slice(0)], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }),
      fileName || "template-hasil-scan.docx"
    );
  };

  const downloadFilled = () => {
    if (filledBlob) downloadBlob(filledBlob, (fileName || "surat").replace(/\.docx$/i, "") + "-contoh-terisi.docx");
  };

  if (!templateBuffer || placeholders.length === 0) {
    return (
      <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center text-xs text-slate-500 bg-slate-50/60">
        Upload template dulu — simulasi surat terisi akan muncul di sini persis seperti hasil cetak.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs font-bold text-slate-800">Live preview — simulasi jadi surat</p>
        <div className="flex items-center gap-1.5">
          {status === "rendering" && <span className="text-[11px] text-blue-600 animate-pulse">Merender...</span>}
          {status === "filled" && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Terisi data contoh</span>
          )}
          {status === "raw" && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Template mentah</span>
          )}
          {(status === "filled" || status === "raw") && (
            <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden text-[10px] font-bold">
              {(["fit", 50, 75, 100] as const).map((z) => (
                <button
                  key={String(z)}
                  type="button"
                  onClick={() => setZoom(z)}
                  className={`px-2 py-1 ${zoom === z ? "bg-[#1b365d] text-white" : "bg-white text-slate-600 hover:bg-slate-100"}`}
                  title={z === "fit" ? "Sesuaikan lebar kolom" : `Zoom ${z}%`}
                >
                  {z === "fit" ? "Fit" : `${z}%`}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {status === "error" ? (
        <div className="border border-red-200 bg-red-50 rounded-xl p-4 space-y-2 text-xs">
          <p className="font-bold text-red-800 flex items-center gap-1.5">
            <FileWarning className="h-4 w-4" /> Preview tidak bisa dirender di browser
          </p>
          {errorDetail && (
            <p className="font-mono text-[11px] text-red-700 bg-white border border-red-200 rounded p-2 break-words">{errorDetail}</p>
          )}
          <p className="text-red-700 leading-relaxed">
            Hasil scan tetap valid. Unduh file di bawah dan buka di Word untuk cek 1:1 — layout dijamin sama karena hasil cetak memakai file yang sama.
          </p>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-300/40 shadow-inner">
          <div ref={containerRef} className="overflow-y-auto bg-slate-300/40" style={{ height: 320 }}>
            <div
              ref={scalerRef}
              className="docx-simulation origin-top-left bg-white [&_.docx-wrapper]:bg-transparent [&_.docx-wrapper]:p-2 [&_.docx]:shadow-none [&_.docx]:m-0"
            />
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" className="text-xs" onClick={downloadScanned}>
          <Download className="mr-1.5 h-3.5 w-3.5" /> Unduh hasil scan (.docx)
        </Button>
        {filledBlob && (
          <Button type="button" size="sm" variant="outline" className="text-xs" onClick={downloadFilled}>
            <Download className="mr-1.5 h-3.5 w-3.5" /> Unduh contoh terisi
          </Button>
        )}
      </div>
      <p className="text-[11px] text-slate-500 leading-relaxed">
        Contoh terisi: BUDI SANTOSO / SITI AMINAH. Hasil Download DOCX admin mengikuti file ini 100%.
      </p>
    </div>
  );
}
