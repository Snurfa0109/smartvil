"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { renderAsync } from "docx-preview";
import { generateSampleFilledDocx, downloadBlob } from "@/lib/letter-template";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Download, FileWarning, Eye, Loader2 } from "lucide-react";

type Props = {
  templateBuffer: ArrayBuffer | null;
  placeholders: string[];
  customFields: { key: string; label: string }[];
  fileName?: string;
};

/**
 * Live preview template surat apa adanya (tanpa data contoh).
 * Render di dalam <iframe> terisolasi supaya CSS Tailwind/global
 * tidak ikut menimpa style bawaan docx-preview.
 * "Unduh Contoh Terisi" generate file terpisah dengan data sample.
 */
export default function LetterSimulationPreview({ templateBuffer, placeholders, customFields, fileName }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<"idle" | "rendering" | "ready" | "error">("idle");
  const [errorDetail, setErrorDetail] = useState("");
  const [downloadingFilled, setDownloadingFilled] = useState(false);
  const [zoom, setZoom] = useState<"fit" | 50 | 75 | 100>("fit");
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const bodyHostRef = useRef<HTMLDivElement | null>(null);

  const applyZoom = useCallback(() => {
    const iframe = iframeRef.current;
    const bodyHost = bodyHostRef.current;
    if (!iframe || !bodyHost) return;
    const doc = iframe.contentDocument;
    if (!doc) return;
    const page = bodyHost.querySelector("section.docx") as HTMLElement | null;
    if (!page) return;
    const pageWidth = page.offsetWidth || 1;
    const avail = iframe.clientWidth - 40;
    const z = zoomRef.current;
    const target = z === "fit" ? Math.min(1, avail / pageWidth) : z / 100;
    bodyHost.style.zoom = String(target);
  }, []);

  useEffect(() => {
    applyZoom();
    window.addEventListener("resize", applyZoom);
    return () => window.removeEventListener("resize", applyZoom);
  }, [applyZoom, zoom, status]);

  // Render template apa adanya (tanpa data contoh) setiap kali buffer berubah
  useEffect(() => {
    if (!templateBuffer || placeholders.length === 0) {
      setStatus("idle");
      return;
    }
    let cancelled = false;
    const render = async () => {
      setStatus("rendering");
      setErrorDetail("");
      bodyHostRef.current = null;

      const rawBlob = new Blob([templateBuffer.slice(0)], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      try {
        const iframe = iframeRef.current;
        if (!iframe) return;
        const doc = iframe.contentDocument;
        if (!doc) return;
        doc.open();
        doc.write(
          '<!DOCTYPE html><html><head><meta charset="utf-8"><style>' +
            'body { margin:0; background:#e8e8e8; }' +
            '.docx-wrapper { background: transparent !important; padding: 20px !important; }' +
            '.docx-wrapper > section.docx { background: white !important; box-shadow: 0 1px 8px rgba(0,0,0,0.2) !important; margin-bottom: 20px !important; }' +
            'section.docx { overflow: visible !important; }' +
            '</style></head>' +
            '<body></body></html>'
        );
        doc.close();
        const styleHost = doc.createElement("div");
        const bodyHost = doc.createElement("div");
        doc.body.appendChild(styleHost);
        doc.body.appendChild(bodyHost);
        bodyHostRef.current = bodyHost;
        await renderAsync(rawBlob, bodyHost, styleHost, {
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          breakPages: true,
          renderHeaders: true,
          renderFooters: true,
          useBase64URL: true,
          ignoreFonts: false,
          experimental: true,
        } as unknown as Record<string, unknown>);
        if (!cancelled) {
          setStatus("ready");
          requestAnimationFrame(() => {
            if (!cancelled) applyZoom();
          });
        }
      } catch (renderErr) {
        console.error("Gagal render preview:", renderErr);
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

  const downloadFilled = async () => {
    if (!templateBuffer) return;
    setDownloadingFilled(true);
    try {
      const blob = await generateSampleFilledDocx(
        templateBuffer.slice(0),
        placeholders,
        customFields
      );
      downloadBlob(blob, (fileName || "surat").replace(/\.docx$/i, "") + "-contoh-terisi.docx");
    } catch (err) {
      console.error("Gagal generate contoh terisi:", err);
    } finally {
      setDownloadingFilled(false);
    }
  };

  if (!templateBuffer || placeholders.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-400 text-sm font-bold flex items-center justify-center">
            <Eye className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <Label className="font-bold text-base text-slate-900 block">Live Preview</Label>
            <p className="text-xs text-slate-600 mt-0.5">Preview template surat</p>
          </div>
        </div>
        <div className="border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center bg-slate-50">
          <div className="w-16 h-16 rounded-2xl bg-slate-200 mx-auto flex items-center justify-center mb-4">
            <FileWarning className="h-8 w-8 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-700 mb-1">Menunggu Template</p>
          <p className="text-xs text-slate-500">Upload template DOCX untuk melihat preview surat secara realtime</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white text-sm font-bold flex items-center justify-center">
            <Eye className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <Label className="font-bold text-base text-slate-900 block">Live Preview</Label>
            <p className="text-xs text-slate-600 mt-0.5">
              {status === "rendering" && "Merender preview..."}
              {status === "ready" && "Template apa adanya — tanpa data contoh"}
              {status === "error" && "Gagal render preview"}
              {status === "idle" && "Siap preview"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {status === "rendering" && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
              <span className="text-xs font-medium text-blue-900">Rendering...</span>
            </div>
          )}
          {status === "ready" && (
            <span className="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">Template Asli</span>
          )}
          {status === "ready" && (
            <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden bg-white">
              {(["fit", 50, 75, 100] as const).map((z) => (
                <button
                  key={String(z)}
                  type="button"
                  onClick={() => setZoom(z)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${zoom === z ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
                  title={z === "fit" ? "Sesuaikan lebar" : `Zoom ${z}%`}
                >
                  {z === "fit" ? "Fit" : `${z}%`}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {status === "error" ? (
        <div className="border border-red-200 bg-red-50 rounded-2xl p-6 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <FileWarning className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm text-red-900">Preview tidak dapat ditampilkan</p>
              <p className="text-xs text-red-700 mt-1 leading-relaxed">
                Browser tidak dapat merender dokumen ini, tetapi file tetap valid dan dapat diunduh.
              </p>
            </div>
          </div>
          {errorDetail && (
            <div className="bg-white border border-red-200 rounded-lg p-3">
              <p className="font-mono text-xs text-red-700 break-words">{errorDetail}</p>
            </div>
          )}
          <p className="text-xs text-red-700 leading-relaxed">
            Unduh file di bawah dan buka di Microsoft Word untuk melihat hasil sebenarnya.
          </p>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-[#e8e8e8]">
          <iframe
            ref={iframeRef}
            title="Live preview surat"
            className="w-full block"
            style={{ height: 560, border: 0, background: "#e8e8e8" }}
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2.5 pt-2">
        <Button type="button" size="sm" variant="outline" className="h-9 text-xs font-medium border-slate-300 hover:bg-slate-50" onClick={downloadScanned}>
          <Download className="mr-2 h-4 w-4" /> Unduh Template Scan
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-9 text-xs font-medium border-slate-300 hover:bg-slate-50"
          onClick={downloadFilled}
          disabled={downloadingFilled}
        >
          {downloadingFilled ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          Unduh Contoh Terisi
        </Button>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
        <p className="text-xs text-amber-900 leading-relaxed">
          <strong className="font-semibold">Preview di atas menampilkan template apa adanya.</strong> Placeholder <code className="bg-amber-100 px-1 rounded">{"{{field}}"}</code> akan terisi otomatis saat warga mengajukan surat. Klik &quot;Unduh Contoh Terisi&quot; untuk melihat hasil dengan data contoh di Word.
        </p>
      </div>
    </div>
  );
}
