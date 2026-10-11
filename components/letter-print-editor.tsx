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
import { buildTemplateData, generateFilledDocx, dataUrlToBuffer, extractNarrativesFromDocx } from "@/lib/letter-template";
import styles from "@/app/letter-print.module.css";

interface LetterPrintEditorProps {
  request: Record<string, unknown>;
  letterTypes: LetterType[];
  printConfig: LetterPrintConfig;
  onPrintConfigChange: (cfg: LetterPrintConfig) => void;
  onClose: () => void;
  onPrint: () => void;
  onDownloadDocx: (mergedRequest: Record<string, unknown>) => Promise<void>;
  downloadingDocx: boolean;
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
  onDownloadDocx,
  downloadingDocx,
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
  const customFields = letterType?.customFields ?? [];
  const [printing, setPrinting] = useState(false);
  const [narratives, setNarratives] = useState<string[]>([]);

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
      } catch {
        setNarratives([]);
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
    const data = buildTemplateData(mergedRequest, printConfig);
    return generateFilledDocx(buf, data);
  }, [getTemplateBuffer, mergedRequest, printConfig]);

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
        'body{margin:0;background:#e8e8e8;}' +
        '.docx-wrapper{background:transparent!important;padding:20px!important;}' +
        '.docx-wrapper>section.docx{background:white!important;box-shadow:0 1px 8px rgba(0,0,0,0.18)!important;margin-bottom:20px!important;}' +
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

  const printFromHtml = useCallback(() => {
    const container = document.getElementById("printable-letter-container");
    if (!container) { window.print(); return; }
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:210mm;height:297mm;border:0";
    document.body.appendChild(iframe);
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) { document.body.removeChild(iframe); window.print(); return; }
    iframeDoc.open();
    iframeDoc.write(`<!DOCTYPE html><html><head><style>
      @page { size: A4; margin: 0; }
      body { margin: 0; padding: 20mm 25mm 25mm 25mm; box-sizing: border-box;
        font-family: Georgia, 'Times New Roman', serif; font-size: 11pt;
        line-height: 1.6; color: black; }
      table { width: 100%; border-collapse: collapse; }
    </style></head><body>${container.innerHTML}</body></html>`);
    iframeDoc.close();
    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    };
  }, []);

  const printFromDocx = useCallback(async () => {
    setPrinting(true);
    try {
      const blob = await generateBlob();
      if (!blob) { printFromHtml(); return; }
      const iframe = document.createElement("iframe");
      iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:210mm;height:297mm;border:0";
      document.body.appendChild(iframe);
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) { document.body.removeChild(iframe); printFromHtml(); return; }
      iframeDoc.open();
      iframeDoc.write('<!DOCTYPE html><html><head><meta charset="utf-8"><style>' +
        '@page{size:A4;margin:0;}body{margin:0;padding:0;}' +
        'section.docx{box-shadow:none!important;margin:0!important;}' +
        '</style></head><body></body></html>');
      iframeDoc.close();
      const styleHost = iframeDoc.createElement("div");
      const bodyHost = iframeDoc.createElement("div");
      iframeDoc.body.appendChild(styleHost);
      iframeDoc.body.appendChild(bodyHost);
      await renderAsync(blob, bodyHost, styleHost, {
        inWrapper: false,
        ignoreWidth: false,
        ignoreHeight: false,
        breakPages: true,
        renderHeaders: true,
        renderFooters: true,
        useBase64URL: true,
        ignoreFonts: false,
        experimental: true,
      } as unknown as Record<string, unknown>);
      await new Promise((r) => setTimeout(r, 500));
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 2000);
    } catch (err) {
      console.error("Cetak DOCX gagal, fallback HTML:", err);
      printFromHtml();
    } finally {
      setPrinting(false);
    }
  }, [generateBlob, printFromHtml]);

  const handlePrint = useCallback(() => {
    if (hasDocxTemplate) {
      printFromDocx();
    } else {
      printFromHtml();
    }
  }, [hasDocxTemplate, printFromDocx, printFromHtml]);

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
                variant="ghost"
                onClick={() => onDownloadDocx(mergedRequest)}
                disabled={downloadingDocx}
                className="text-blue-200 hover:bg-white/10 hover:text-white border border-white/15 h-8 text-xs gap-1.5 px-3"
              >
                {downloadingDocx ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">{downloadingDocx ? "Membuat..." : "Unduh DOCX"}</span>
              </Button>
            )}
            <Button
              size="sm"
              onClick={handlePrint}
              disabled={printing || downloadingDocx}
              className="bg-white text-[#1b365d] hover:bg-blue-50 font-semibold h-8 text-xs gap-1.5 px-4 shadow-sm"
            >
              {printing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Printer className="h-3.5 w-3.5" />
              )}
              {printing ? "Menyiapkan..." : "Cetak / PDF"}
            </Button>
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
                    <p className="text-[10px] text-slate-500 mb-2">Paragraf narasi dari template. Teks ini sudah tercetak di surat, ditampilkan sebagai referensi.</p>
                    {narratives.map((text, i) => (
                      <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700 leading-relaxed">
                        {text}
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
              <Button
                onClick={handlePrint}
                disabled={printing}
                className="w-full bg-[#1b365d] hover:bg-[#152a48] h-10 gap-2 font-semibold"
              >
                {printing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Printer className="h-4 w-4" />
                )}
                {printing ? "Menyiapkan Cetak..." : "Cetak / Simpan PDF"}
              </Button>
              {hasDocxTemplate && (
                <Button
                  variant="outline"
                  onClick={() => onDownloadDocx(mergedRequest)}
                  disabled={downloadingDocx}
                  className="w-full h-9 gap-2 text-sm"
                >
                  {downloadingDocx ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Unduh DOCX Presisi
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
                        <p className="text-xs text-amber-300 mt-1">Gunakan tombol &quot;Unduh DOCX Presisi&quot; untuk melihat hasil sebenarnya di Microsoft Word.</p>
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
