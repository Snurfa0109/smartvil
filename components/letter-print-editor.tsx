"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  X,
  Printer,
  Download,
  FileText,
  User,
  Hash,
  Calendar,
  PenLine,
  Eye,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import type { LetterType } from "@/lib/letters";
import type { LetterPrintConfig } from "@/components/letter-print-document";
import LetterPrintDocument from "@/components/letter-print-document";
import styles from "@/app/letter-print.module.css";

interface LetterPrintEditorProps {
  request: any;
  letterTypes: LetterType[];
  printConfig: LetterPrintConfig;
  onPrintConfigChange: (cfg: LetterPrintConfig) => void;
  onClose: () => void;
  onPrint: () => void;
  onDownloadDocx: (mergedRequest: any) => Promise<void>;
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
  onPrint,
  onDownloadDocx,
  downloadingDocx,
}: LetterPrintEditorProps) {  const letterType = letterTypes.find((lt) => lt.code === request?.type);

  const [editable, setEditable] = useState<EditableRequest>({
    nama: request?.nama ?? "",
    nik: request?.nik ?? "",
    phone: request?.phone ?? "",
    keperluan: request?.keperluan ?? "",
    templateNarrative: request?.templateNarrative || letterType?.templateNarrative || "",
    formData: Object.fromEntries(
      Object.entries(request?.formData ?? {}).map(([k, v]) => [k, String(v ?? "")])
    ),
  });

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    pemohon: true,
    narasi: false,
    nomor: false,
    signer: false,
    custom: true,
  });

  const mergedRequest = {
    ...request,
    nama: editable.nama,
    nik: editable.nik,
    phone: editable.phone,
    keperluan: editable.keperluan,
    templateNarrative: editable.templateNarrative,
    formData: editable.formData,
  };

  const toggleSection = (key: string) =>
    setOpenSections((p) => ({ ...p, [key]: !p[key] }));

  const updateFormData = (key: string, val: string) =>
    setEditable((p) => ({ ...p, formData: { ...p.formData, [key]: val } }));

  const hasDocxTemplate = !!(letterType?.templateFileUrl || letterType?.templateData);
  const customFields = letterType?.customFields ?? [];

  const handlePrint = () => {
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
  };

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
                {request?.ticketCode && (
                  <span className="text-[10px] font-mono bg-white/10 border border-white/20 text-blue-100 px-1.5 py-0.5 rounded">
                    {request.ticketCode}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-blue-300 mt-0.5 truncate">
                {request?.typeName || "Surat Keterangan"}
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
              className="bg-white text-[#1b365d] hover:bg-blue-50 font-semibold h-8 text-xs gap-1.5 px-4 shadow-sm"
            >
              <Printer className="h-3.5 w-3.5" />
              Cetak / PDF
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

              {/* Panel label */}
              <div className="px-5 pt-4 pb-3">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                  Edit Dokumen
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
                    title="Data Tambahan"
                    icon={Hash}
                    open={openSections["custom"]}
                    onToggle={() => toggleSection("custom")}
                  >
                    {customFields.map((f) => (
                      <Field key={f.key} label={f.label}>
                        {f.type === "textarea" ? (
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

                <Accordion
                  title="Narasi & Isi Surat"
                  icon={PenLine}
                  open={openSections["narasi"]}
                  onToggle={() => toggleSection("narasi")}
                >
                  <Textarea
                    value={editable.templateNarrative}
                    onChange={(e) => setEditable((p) => ({ ...p, templateNarrative: e.target.value }))}
                    placeholder="Menerangkan bahwa nama tersebut di atas adalah benar warga..."
                    className="min-h-[130px] resize-y text-sm font-serif leading-relaxed"
                  />
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Paragraf penutup baku ("Demikian surat...") ditambahkan otomatis.
                  </p>
                </Accordion>

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
                className="w-full bg-[#1b365d] hover:bg-[#152a48] h-10 gap-2 font-semibold"
              >
                <Printer className="h-4 w-4" />
                Cetak / Simpan PDF
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
            {/* Preview toolbar */}
            <div className={styles.previewPaneHeader}>
              <div className="flex items-center gap-2">
                <Eye className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-semibold text-slate-300">Pratinjau Dokumen</span>
                <span className="inline-flex items-center gap-1.5 text-[10px] bg-emerald-500/15 text-emerald-400 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/25">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  Realtime
                </span>
              </div>
              <span className="text-[10px] text-slate-500">A4 · Georgia 11pt · Identik dengan hasil cetak</span>
            </div>

            {/* Paper */}
            <div className={styles.previewPaneBody}>
              <div className={styles.paper}>
                <LetterPrintDocument
                  request={mergedRequest}
                  letterTypes={letterTypes}
                  printConfig={printConfig}
                />
              </div>
            </div>
          </div>

        </div>
      </div>

      <div id="printable-letter-container" style={{ display: "none" }}>
        <LetterPrintDocument
          request={mergedRequest}
          letterTypes={letterTypes}
          printConfig={printConfig}
        />
      </div>
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
