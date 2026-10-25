/**
 * [CORE LIBRARY / SISTEM] Konfigurasi Engine AI Chatbot Arba
 * Tipe data setelan chatbot, prompt sistem, dan pembacaan konfigurasi AI dari database.
 */

import { getSetting, saveSetting } from "@/lib/settings-store";

export type AIProvider = "auto" | "groq" | "gemini";

export interface ChatbotSettings {
  enabled: boolean;
  botName: string;
  welcomeMessage: string;
  provider?: AIProvider;
  selectedModel: string;
  temperature: number;
  allowedTopics: string;
  forbiddenTopics: string;
  refusalMessage: string;
  includeLiveContext: boolean;
  customApiKey?: string;
  updatedAt?: string;
}

export const DEFAULT_CHATBOT_SETTINGS: ChatbotSettings = {
  enabled: true,
  botName: "Arba",
  welcomeMessage:
    "Sugeng rawuh! Saya Arba, asisten virtual Kelurahan Banjar Agung. Ada yang mau ditanyakan soal surat keterangan, pengaduan, atau info layanan lainnya? Saya siap bantu!\n\nKalau perlu layanan langsung, bisa hubungi kami di:\n- WhatsApp: 0813-1505-3901\n- Jam pelayanan: Senin - Jumat, 08.00 - 15.30 WIB",
  provider: "auto",
  selectedModel: "openai/gpt-oss-20b",
  temperature: 0.2,
  allowedTopics:
    "- Informasi profil wilayah, visi, misi, dan struktur organisasi Pemerintah Kelurahan Banjar Agung.\n" +
    "- Panduan, jenis, dan syarat pengajuan surat administrasi (SKTM, Keterangan Domisili, Keterangan Usaha/SKU, Pengantar KTP/KK, Keterangan Kelahiran, Keterangan Kematian).\n" +
    "- Informasi alamat kantor kelurahan, nomor kontak WhatsApp pelayanan, loket, dan jam operasional kerja.\n" +
    "- Alur penyampaian pengaduan atau aspirasi warga.\n" +
    "- Agenda kegiatan, program lingkungan (Rabu Asri), penyaluran bantuan sosial pangan, dan pengumuman resmi.",
  forbiddenTopics:
    "- Pemrograman, penulisan kode komputer, atau tugas teknis non-pemerintahan.\n" +
    "- Opini politik, partai politik, atau pemilu.\n" +
    "- Diagnosis medis, resep obat, atau saran klinis.\n" +
    "- Nasehat hukum formal di luar ranah administrasi kelurahan.\n" +
    "- Percakapan bebas atau pengetahuan umum yang tidak berkaitan dengan pelayanan Kelurahan Banjar Agung.",
  refusalMessage:
    "Mohon maaf, kanal ini khusus melayani informasi administrasi, layanan surat, dan pengaduan warga Kelurahan Banjar Agung. Untuk keperluan lainnya, silakan datang langsung ke Kantor Kelurahan pada jam kerja (Senin - Jumat, 08:00 - 15:30 WIB).",
  includeLiveContext: true,
};

export async function getChatbotSettings(): Promise<ChatbotSettings> {
  try {
    const stored = await getSetting<Partial<ChatbotSettings>>("chatbot", {});
    return { ...DEFAULT_CHATBOT_SETTINGS, ...stored };
  } catch {
    return { ...DEFAULT_CHATBOT_SETTINGS };
  }
}

export async function saveChatbotSettings(settings: ChatbotSettings): Promise<void> {
  await saveSetting("chatbot", settings);
}
