"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { renderAsync } from "docx-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  X,
  Printer,
  Download,
  User,
  Hash,
  Calendar,
  PenLine,
  Eye,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import type { LetterType } from "@/lib/letters";
import type { LetterPrintConfig } from "@/components/letter-print-document";
import LetterPrintDocument from "@/components/letter-print-document";
import { buildTemplateData, generateFilledDocx, dataUrlToBuffer, extractNarrativesFromDocx, replaceNarrativesInDocx, downloadBlob } from "@/lib/letter-template";
import { ADMIN_ONLY_FIELDS } from "@/lib/letter-constants";
import { DOCX_PREVIEW_CSS } from "@/lib/docx-preview-styles";
import styles from "@/app/letter-print.module.css";

// docx-preview renders anchor images as 0×0 inline-block divs inside <p>,
// breaking header text flow. This extracts the logo, fixes bidi direction,
// and adjusts SVG separator positioning.
function fixDocxPreviewDom(root: HTMLElement) {
  const header = root.querySelector("header");
  if (header) {
    header.style.position = "relative";
    header.style.overflow = "visible";
    const mh = parseFloat(header.style.minHeight);
    if (isNaN(mh) || mh < 0) {
      header.style.minHeight = "80pt";
    }

    // Find the 0×0 logo wrapper div (nested inside a <p> > <span>)
    const logoDiv = header.querySelector<HTMLElement>('div[style*="width: 0px"]');
    if (logoDiv) {
      const img = logoDiv.querySelector("img");
      if (img) {
        // Remove the old wrapper div and clean up ancestor spans
        let ancestor: HTMLElement | null = logoDiv.parentElement;
        logoDiv.remove();

        while (ancestor && ancestor.tagName !== "P" && ancestor.tagName !== "HEADER") {
          const next: HTMLElement | null = ancestor.parentElement;
          if (!ancestor.textContent?.trim() && !ancestor.querySelector("img")) {
            ancestor.remove();
          }
          ancestor = next;
        }

        const parentP = header.querySelector("p");
        if (parentP) {
          parentP.querySelectorAll<HTMLElement>("span[id]").forEach((sp) => {
            if (!sp.textContent?.trim() && !sp.querySelector("img")) {
              sp.remove();
            }
          });
        }

        // The source image is the full coat-of-arms with text below it.
        // Word crops it via srcRect: l=18.113% t=3.962% r=14.528% b=29.246%
        // This means: show only the center emblem, hide bottom text.
        // Use clip-path inset to replicate the exact Word crop.
        img.style.cssText = [
          "display:block",
          "width:95pt",
          "height:auto",
          "clip-path:inset(3.96% 14.53% 29.25% 18.11%)",
        ].join(";");

        const logoContainer = root.ownerDocument.createElement("div");
        logoContainer.style.cssText = "position:absolute;left:-5pt;top:-2pt;width:95pt;height:75pt;overflow:hidden;z-index:10;";
        logoContainer.appendChild(img);
        header.insertBefore(logoContainer, header.firstChild);
      }
    }
  }

  // docx-preview renders w:bidi as direction:rtl; reset to ltr
  root.querySelectorAll<HTMLElement>("p[style]").forEach((p) => {
    if (p.style.direction !== "rtl") return;
    p.style.direction = "ltr";
    p.style.unicodeBidi = "normal";
    p.style.removeProperty("margin-inline");
    p.style.marginInlineStart = "85.5pt";
    p.style.marginInlineEnd = "0pt";
  });

  // SVG separator line rendered incorrectly; fix positioning
  root.querySelectorAll<HTMLElement>("p.docx_header[style]").forEach((p) => {
    if (p.style.marginInlineStart) {
      p.style.marginInlineStart = "0pt";
    }
    const svg = p.querySelector("svg");
    if (svg) {
      svg.setAttribute("width", "100%");
      svg.setAttribute("height", "14pt");
      svg.style.position = "relative";
      svg.style.left = "0";
      svg.style.zIndex = "1";
      const line = svg.querySelector("line");
      if (line) {
        line.setAttribute("x1", "0");
        line.setAttribute("x2", "100%");
        line.setAttribute("stroke", "black");
        line.setAttribute("stroke-width", "1.5px");
      }
    }
  });

  // 4. Section positioning context
  root.querySelectorAll<HTMLElement>("section.docx").forEach((sec) => {
    sec.style.position = "relative";
  });
}

interface LetterPrintEditorProps {
  request: Record<string, unknown>;
  letterTypes: LetterType[];
  printConfig: LetterPrintConfig;
  onPrintConfigChange: (cfg: LetterPrintConfig) => void;
  onClose: () => void;
}

interface EditableRequest {
  nama: string;
  nik: string;
  phone: string;
  keperluan: string;
  templateNarrative: string;
  formData: Record<string, string>;
}

export default function LetterPrintEditor({
  request,
  letterTypes,
  printConfig,
  onPrintConfigChange,
  onClose,
}: LetterPrintEditorProps) {
  const letterType = letterTypes.find((lt) => lt.code === (request as Record<string, string>)?.type);

  const [editable, setEditable] = useState<EditableRequest>(() => {
    const rawFormData = Object.fromEntries(
      Object.entries((request?.formData as Record<string, unknown>) ?? {}).map(([k, v]) => [k, String(v ?? "")])
    );
    const cf = letterType?.customFields ?? [];
    for (const f of cf) {
      if (f.defaultValue && !rawFormData[f.key]) {
        rawFormData[f.key] = f.defaultValue;
      }
    }
    return {
      nama: String(request?.nama ?? ""),
      nik: String(request?.nik ?? ""),
      phone: String(request?.phone ?? ""),
      keperluan: String(request?.keperluan ?? ""),
      templateNarrative: String(request?.templateNarrative || letterType?.templateNarrative || ""),
      formData: rawFormData,
    };
  });

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    pemohon: true,
    custom: true,
    narasi: true,
    nomor: false,
    signer: false,
  });

  const mergedRequest = useMemo(() => ({
    ...request,
    nama: editable.nama,
    nik: editable.nik,
    phone: editable.phone,
    keperluan: editable.keperluan,
    templateNarrative: editable.templateNarrative,
    formData: editable.formData,
  }), [request, editable]);

  const toggleSection = (key: string) =>
    setOpenSections((p) => ({ ...p, [key]: !p[key] }));

  const updateFormData = (key: string, val: string) =>
    setEditable((p) => ({ ...p, formData: { ...p.formData, [key]: val } }));

  const hasDocxTemplate = !!(letterType?.templateFileUrl || letterType?.templateData);
  const customFields = (letterType?.customFields ?? []).filter(
    (f) => !ADMIN_ONLY_FIELDS.has(f.key.toLowerCase())
  );
  const [narratives, setNarratives] = useState<string[]>([]);
  const [originalNarratives, setOriginalNarratives] = useState<string[]>([]);
  const [editedNarratives, setEditedNarratives] = useState<string[]>([]);

  useEffect(() => {
    if (!hasDocxTemplate) return;
    const loadNarratives = async () => {
      try {
        const src = letterType?.templateFileUrl || letterType?.templateData;
        if (!src) return;
        let buf: ArrayBuffer;
        if (src.startsWith("data:")) {
          buf = await dataUrlToBuffer(src);
        } else {
          const res = await fetch(src);
          if (!res.ok) return;
          buf = await res.arrayBuffer();
        }
        const paras = extractNarrativesFromDocx(buf);
        setNarratives(paras);
        setOriginalNarratives(paras);
        setEditedNarratives([...paras]);
      } catch {
        setNarratives([]);
        setOriginalNarratives([]);
        setEditedNarratives([]);
      }
    };
    loadNarratives();
  }, [hasDocxTemplate, letterType]);

  const previewIframeRef = useRef<HTMLIFrameElement>(null);
  const [previewStatus, setPreviewStatus] = useState<"idle" | "rendering" | "done" | "error">("idle");
  const renderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getTemplateBuffer = useCallback(async (): Promise<ArrayBuffer | null> => {
    const src = letterType?.templateFileUrl || letterType?.templateData;
    if (!src) return null;
    if (src.startsWith("data:")) return dataUrlToBuffer(src);
    const res = await fetch(src);
    if (!res.ok) return null;
    return res.arrayBuffer();
  }, [letterType]);

  const generateBlob = useCallback(async (): Promise<Blob | null> => {
    const buf = await getTemplateBuffer();
    if (!buf) return null;
    const patched = originalNarratives.length > 0
      ? replaceNarrativesInDocx(buf, originalNarratives, editedNarratives)
      : buf;
    const data = buildTemplateData(mergedRequest, printConfig);
    return generateFilledDocx(patched, data);
  }, [getTemplateBuffer, mergedRequest, printConfig, originalNarratives, editedNarratives]);

  const renderDocxPreview = useCallback(async () => {
    if (!hasDocxTemplate) return;
    setPreviewStatus("rendering");
    try {
      const blob = await generateBlob();
      if (!blob) { setPreviewStatus("error"); return; }
      const iframe = previewIframeRef.current;
      if (!iframe) return;
      const doc = iframe.contentDocument;
      if (!doc) return;
      doc.open();
      doc.write(
        '<!DOCTYPE html><html><head><meta charset="utf-8"><style>' +
        DOCX_PREVIEW_CSS +
        '</style></head><body></body></html>'
      );
      doc.close();
      const styleHost = doc.createElement("div");
      const bodyHost = doc.createElement("div");
      doc.body.appendChild(styleHost);
      doc.body.appendChild(bodyHost);
      await renderAsync(blob, bodyHost, styleHost, {
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
      fixDocxPreviewDom(bodyHost);
      const page = bodyHost.querySelector("section.docx") as HTMLElement | null;
      if (page) {
        const pageW = page.offsetWidth || 1;
        const avail = iframe.clientWidth - 40;
        const scale = Math.min(1, avail / pageW);
        bodyHost.style.zoom = String(scale);
      }
      setPreviewStatus("done");
    } catch (err) {
      console.error("Preview DOCX gagal:", err);
      setPreviewStatus("error");
    }
  }, [hasDocxTemplate, generateBlob]);

  useEffect(() => {
    if (!hasDocxTemplate) return;
    if (renderTimerRef.current) clearTimeout(renderTimerRef.current);
    renderTimerRef.current = setTimeout(() => {
      renderDocxPreview();
    }, 600);
    return () => { if (renderTimerRef.current) clearTimeout(renderTimerRef.current); };
  }, [mergedRequest, printConfig, hasDocxTemplate, renderDocxPreview]);

  const [internalDownloading, setInternalDownloading] = useState(false);
  const handleInternalDownloadDocx = useCallback(async () => {
    setInternalDownloading(true);
    try {
      const blob = await generateBlob();
      if (!blob) return;
      const name = `${(request as Record<string, string>)?.typeName || "surat"}-${(request as Record<string, string>)?.ticketCode || "doc"}.docx`;
      downloadBlob(blob, name);
    } catch (err) {
      console.error("Download DOCX gagal:", err);
    } finally {
      setInternalDownloading(false);
    }
  }, [generateBlob, request]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const content = (
    <>
      <div className="fixed inset-0 z-50 flex flex-col overflow-hidden" style={{ background: "#0f172a" }}>

        {/* Topbar */}
        <div className="shrink-0 bg-[#1b365d] border-b border-white/10 px-5 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
              <Printer className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white leading-none">Cetak Surat Resmi</span>
                {(request as Record<string, string>)?.ticketCode && (
                  <span className="text-[10px] font-mono bg-white/10 border border-white/20 text-blue-100 px-1.5 py-0.5 rounded">
                    {(request as Record<string, string>).ticketCode}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-blue-300 mt-0.5 truncate">
                {(request as Record<string, string>)?.typeName || "Surat Keterangan"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {hasDocxTemplate && (
              <Button
                size="sm"
                onClick={handleInternalDownloadDocx}
                disabled={internalDownloading}
                className="bg-white text-[#1b365d] hover:bg-blue-50 font-semibold h-8 text-xs gap-1.5 px-4 shadow-sm"
              >
                {internalDownloading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                {internalDownloading ? "Membuat..." : "Unduh DOCX"}
              </Button>
            )}
            <div className="w-px h-5 bg-white/15 mx-0.5" />
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              className="text-white/50 hover:bg-white/10 hover:text-white h-8 w-8 px-0"
              title="Tutup (Esc)"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Body: two-column */}
        <div className="flex flex-1 overflow-hidden">

          {/* Left: Edit panel */}
          <div className="w-[360px] xl:w-[400px] shrink-0 flex flex-col overflow-hidden bg-[#f8fafc] border-r border-slate-200/60">
            <div className="overflow-y-auto flex-1">

              <div className="px-5 pt-4 pb-3">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                  Edit Data Surat
                </p>
              </div>

              <div className="px-3 pb-3 space-y-1.5">

                <Accordion
                  title="Data Pemohon"
                  icon={User}
                  open={openSections["pemohon"]}
                  onToggle={() => toggleSection("pemohon")}
                >
                  <Field label="Nama Lengkap">
                    <Input
                      value={editable.nama}
                      onChange={(e) => setEditable((p) => ({ ...p, nama: e.target.value }))}
                      placeholder="Nama lengkap pemohon"
                      className="h-9 text-sm"
                    />
                  </Field>
                  <Field label="NIK (No. KTP)">
                    <Input
                      value={editable.nik}
                      onChange={(e) => setEditable((p) => ({ ...p, nik: e.target.value }))}
                      placeholder="16 digit NIK"
                      className="h-9 text-sm font-mono tracking-wider"
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="No. Telepon / WA">
                      <Input
                        value={editable.phone}
                        onChange={(e) => setEditable((p) => ({ ...p, phone: e.target.value }))}
                        placeholder="08xxxxxxxxxx"
                        className="h-9 text-sm"
                      />
                    </Field>
                    <Field label="Keperluan">
                      <Input
                        value={editable.keperluan}
                        onChange={(e) => setEditable((p) => ({ ...p, keperluan: e.target.value }))}
                        placeholder="Tujuan surat"
                        className="h-9 text-sm"
                      />
                    </Field>
                  </div>
                </Accordion>

                {customFields.length > 0 && (
                  <Accordion
                    title="Data Tambahan (Template)"
                    icon={Hash}
                    open={openSections["custom"]}
                    onToggle={() => toggleSection("custom")}
                  >
                    {customFields.map((f) => (
                      <Field key={f.key} label={f.label}>
                        {f.type === "select" && f.options && f.options.length > 0 ? (
                          <select
                            value={editable.formData[f.key] ?? ""}
                            onChange={(e) => updateFormData(f.key, e.target.value)}
                            className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#1b365d]"
                          >
                            <option value="">Pilih {f.label.toLowerCase()}...</option>
                            {f.options.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : f.type === "textarea" ? (
                          <Textarea
                            value={editable.formData[f.key] ?? ""}
                            onChange={(e) => updateFormData(f.key, e.target.value)}
                            placeholder={f.label}
                            className="min-h-[72px] resize-none text-sm"
                          />
                        ) : (
                          <Input
                            type={f.type === "date" ? "date" : f.type === "number" ? "number" : "text"}
                            value={editable.formData[f.key] ?? ""}
                            onChange={(e) => updateFormData(f.key, e.target.value)}
                            placeholder={f.label}
                            className="h-9 text-sm"
                          />
                        )}
                      </Field>
                    ))}
                  </Accordion>
                )}

                {narratives.length > 0 && (
                  <Accordion
                    title="Isi Paragraf Surat"
                    icon={PenLine}
                    open={openSections["narasi"]}
                    onToggle={() => toggleSection("narasi")}
                  >
                    <p className="text-[10px] text-slate-500 mb-2">Paragraf narasi dari template. Anda bisa mengedit teks di bawah ini sebelum mencetak surat.</p>
                    {editedNarratives.map((text, i) => (
                      <div key={i} className="mb-2">
                        <Label className="text-[10px] text-slate-400 mb-1">Paragraf {i + 1}</Label>
                        <Textarea
                          value={text}
                          onChange={(e) => {
                            const updated = [...editedNarratives];
                            updated[i] = e.target.value;
                            setEditedNarratives(updated);
                          }}
                          className="min-h-[72px] resize-none text-xs leading-relaxed"
                        />
                      </div>
                    ))}
                  </Accordion>
                )}

                <Accordion
                  title="Nomor & Tanggal Surat"
                  icon={Hash}
                  open={openSections["nomor"]}
                  onToggle={() => toggleSection("nomor")}
                >
                  <Field label="Nomor Surat">
                    <Input
                      value={printConfig.nomorSurat}
                      onChange={(e) => onPrintConfigChange({ ...printConfig, nomorSurat: e.target.value })}
                      placeholder="470 / 001 / PEM-SMV / X / 2026"
                      className="h-9 text-sm font-mono"
                    />
                  </Field>
                  <Field label="Tanggal Surat">
                    <Input
                      value={printConfig.tanggalSurat}
                      onChange={(e) => onPrintConfigChange({ ...printConfig, tanggalSurat: e.target.value })}
                      placeholder="1 Oktober 2026"
                      className="h-9 text-sm"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Otomatis mengisi &quot;Kota, [tanggal]&quot; di template</p>
                  </Field>
                </Accordion>

                <Accordion
                  title="Pejabat Penandatangan"
                  icon={Calendar}
                  open={openSections["signer"]}
                  onToggle={() => toggleSection("signer")}
                >
                  <Field label="Nama Pejabat">
                    <Input
                      value={printConfig.pejabatNama}
                      onChange={(e) => onPrintConfigChange({ ...printConfig, pejabatNama: e.target.value })}
                      placeholder="Nama lengkap pejabat"
                      className="h-9 text-sm"
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Jabatan">
                      <Input
                        value={printConfig.pejabatJabatan}
                        onChange={(e) => onPrintConfigChange({ ...printConfig, pejabatJabatan: e.target.value })}
                        placeholder="Lurah"
                        className="h-9 text-sm"
                      />
                    </Field>
                    <Field label="NIP">
                      <Input
                        value={printConfig.pejabatNip}
                        onChange={(e) => onPrintConfigChange({ ...printConfig, pejabatNip: e.target.value })}
                        placeholder="NIP"
                        className="h-9 text-sm font-mono"
                      />
                    </Field>
                  </div>
                </Accordion>

              </div>
            </div>

            {/* Sticky action footer */}
            <div className="shrink-0 p-4 border-t border-slate-200 bg-white space-y-2">
              {hasDocxTemplate && (
                <Button
                  onClick={handleInternalDownloadDocx}
                  disabled={internalDownloading}
                  className="w-full bg-[#1b365d] hover:bg-[#152a48] h-10 gap-2 font-semibold"
                >
                  {internalDownloading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {internalDownloading ? "Membuat DOCX..." : "Unduh DOCX"}
                </Button>
              )}
            </div>
          </div>

          {/* Right: Live Preview */}
          <div className={styles.previewPane}>
            <div className={styles.previewPaneHeader}>
              <div className="flex items-center gap-2">
                <Eye className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-semibold text-slate-300">Pratinjau Dokumen</span>
                {previewStatus === "rendering" && (
                  <span className="inline-flex items-center gap-1.5 text-[10px] text-blue-400 font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/25">
                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                    Merender...
                  </span>
                )}
                {previewStatus === "done" && (
                  <span className="inline-flex items-center gap-1.5 text-[10px] bg-emerald-500/15 text-emerald-400 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/25">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    Realtime
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-500">
                {hasDocxTemplate ? "Preview dari template DOCX" : "Preview HTML (tanpa template)"}
              </span>
            </div>

            <div className={styles.previewPaneBody}>
              {hasDocxTemplate ? (
                <>
                  {previewStatus === "error" && (
                    <div className="bg-amber-900/50 border border-amber-700 rounded-xl p-4 mb-4 max-w-[600px] mx-auto flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-200">Preview tidak dapat ditampilkan</p>
                        <p className="text-xs text-amber-300 mt-1">Preview ini perkiraan. Layout final (header, tabel, border) bisa berbeda. Gunakan &quot;Unduh DOCX&quot; lalu buka di Word untuk hasil 100% akurat.</p>
                      </div>
                    </div>
                  )}
                  <iframe
                    ref={previewIframeRef}
                    title="Preview surat DOCX"
                    className="w-full flex-1 block rounded-lg"
                    style={{ border: 0, background: "#e8e8e8", minHeight: 500 }}
                  />
                </>
              ) : (
                <div className={styles.paper}>
                  <LetterPrintDocument
                    request={mergedRequest}
                    letterTypes={letterTypes}
                    printConfig={printConfig}
                  />
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {!hasDocxTemplate && (
        <div id="printable-letter-container" style={{ display: "none" }}>
          <LetterPrintDocument
            request={mergedRequest}
            letterTypes={letterTypes}
            printConfig={printConfig}
          />
        </div>
      )}
    </>
  );

  return createPortal(content, document.body);
}

function Accordion({
  title,
  icon: Icon,
  open,
  onToggle,
  children,
}: {
  title: string;
  icon: React.ElementType;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 text-left hover:bg-slate-50/80 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-[#1b365d]/8 flex items-center justify-center shrink-0">
            <Icon className="h-3.5 w-3.5 text-[#1b365d]" />
          </div>
          <span className="text-sm font-semibold text-slate-700">{title}</span>
        </div>
        {open ? (
          <ChevronUp className="h-3.5 w-3.5 text-slate-400 shrink-0" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-3.5 pt-0.5 pb-3.5 space-y-3 border-t border-slate-100">
          {children}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] font-medium text-slate-500">{label}</Label>
      {children}
    </div>
  );
}
