"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  MessageSquare, 
  X, 
  Send, 
  Bot, 
  User, 
  Minimize2, 
  Maximize2,
  RefreshCw
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { DEFAULT_CHATBOT_SETTINGS } from "@/lib/chatbot-config";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  time: string;
}

const QUICK_PROMPTS = [
  "Syarat buat Surat Keterangan Usaha?",
  "Bagaimana cara membuat SKTM?",
  "Bagaimana cara lapor pengaduan?",
  "Informasi kontak kantor kelurahan?",
];

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [botName, setBotName] = useState(DEFAULT_CHATBOT_SETTINGS.botName);
  const [welcomeText, setWelcomeText] = useState(DEFAULT_CHATBOT_SETTINGS.welcomeMessage);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize welcome message once and fetch saved settings if available
  useEffect(() => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages([
      {
        id: "welcome-msg",
        role: "model",
        text: DEFAULT_CHATBOT_SETTINGS.welcomeMessage,
        time: timeStr,
      },
    ]);

    const loadRemoteChatbotSettings = async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "chatbot"));
        if (snap.exists()) {
          const data = snap.data();
          if (data.botName) setBotName(data.botName);
          if (data.welcomeMessage) {
            setWelcomeText(data.welcomeMessage);
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === "welcome-msg" ? { ...msg, text: data.welcomeMessage } : msg
              )
            );
          }
        }
      } catch (err) {
        console.warn("Could not load dynamic chatbot settings:", err);
      }
    };

    loadRemoteChatbotSettings();
  }, []);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, isOpen, isMinimized]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
    }
  }, [isOpen, isMinimized]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;

    const userTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      text: textToSend.trim(),
      time: userTime,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInput("");
    setLoading(true);

    try {
      // Build history for context (exclude the welcome message if desired, or include)
      const historyPayload = messages
        .filter((m) => m.id !== "welcome-msg")
        .slice(-6)
        .map((m) => ({
          role: m.role,
          parts: [{ text: m.text }],
        }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend.trim(),
          history: historyPayload,
        }),
      });

      const data = await res.json();
      const botTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      if (data.botName) {
        setBotName(data.botName);
      }

      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "model",
            text: data.reply,
            time: botTime,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "model",
            text: data.error || "Maaf, terjadi gangguan saat menghubungkan ke asisten virtual.",
            time: botTime,
          },
        ]);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      const botTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "model",
          text: "Mohon maaf, koneksi ke server sedang bermasalah. Silakan periksa koneksi internet Anda atau coba beberapa saat lagi.",
          time: botTime,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResetChat = () => {
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages([
      {
        id: Date.now().toString(),
        role: "model",
        text: welcomeText,
        time: timeStr,
      },
    ]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window Dialog */}
      {isOpen && (
        <div
          className={`w-[92vw] sm:w-[400px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden transition-all duration-200 mb-3 ${
            isMinimized ? "h-16" : "h-[540px] max-h-[82vh]"
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1b365d] to-[#234575] text-white p-3.5 flex items-center justify-between select-none shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="relative shrink-0 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/head-arba.png"
                  alt="Arba"
                  className="h-11 w-11 object-contain drop-shadow-sm"
                />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#1b365d]" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight text-white">{botName || "Arba"}</h3>
                <p className="text-[11px] text-blue-100">
                  Asisten Ramah Banjar Agung
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                title="Mulai percakapan baru"
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? "Perbesar" : "Perkecil"}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Tutup Obrolan"
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/70">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${
                      msg.role === "user" ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <div className="shrink-0 flex items-center justify-center">
                      {msg.role === "user" ? (
                        <div className="h-7 w-7 rounded-full bg-[#1b365d] text-white flex items-center justify-center text-xs shadow-xs">
                          <User className="h-3.5 w-3.5" />
                        </div>
                      ) : (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src="/images/head-arba.png"
                          alt="Arba"
                          className="h-8 w-8 object-contain drop-shadow-xs"
                        />
                      )}
                    </div>

                    <div
                      className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-[#1b365d] text-white rounded-tr-xs shadow-xs"
                          : "bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs shadow-xs"
                      }`}
                    >
                      {msg.role === "model" ? (
                        <div className="text-slate-800 text-xs sm:text-sm leading-relaxed">
                          <ReactMarkdown
                            components={{
                              h1: ({ children }) => (
                                <h4 className="font-bold text-slate-900 text-sm mt-2.5 mb-1 pb-0.5 border-b border-slate-200">
                                  {children}
                                </h4>
                              ),
                              h2: ({ children }) => (
                                <h4 className="font-bold text-slate-900 text-xs sm:text-sm mt-2 mb-1">
                                  {children}
                                </h4>
                              ),
                              h3: ({ children }) => (
                                <h5 className="font-semibold text-slate-900 text-xs sm:text-sm mt-2 mb-1">
                                  {children}
                                </h5>
                              ),
                              p: ({ children }) => (
                                <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
                              ),
                              ul: ({ children }) => (
                                <ul className="list-disc pl-4 space-y-1 my-1.5">{children}</ul>
                              ),
                              ol: ({ children }) => (
                                <ol className="list-decimal pl-4 space-y-1 my-1.5">{children}</ol>
                              ),
                              li: ({ children }) => <li className="pl-0.5">{children}</li>,
                              strong: ({ children }) => (
                                <strong className="font-semibold text-slate-950">{children}</strong>
                              ),
                              hr: () => <hr className="my-2.5 border-slate-200" />,
                              a: ({ href, children }) => {
                                if (href?.startsWith("/")) {
                                  return (
                                    <Link
                                      href={href}
                                      className="text-[#1b365d] hover:underline font-semibold"
                                    >
                                      {children}
                                    </Link>
                                  );
                                }
                                return (
                                  <a
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#1b365d] hover:underline font-semibold"
                                  >
                                    {children}
                                  </a>
                                );
                              },
                              code: ({ children }) => (
                                <code className="bg-slate-100 text-slate-800 text-[11px] px-1.5 py-0.5 rounded font-mono border border-slate-200">
                                  {children}
                                </code>
                              ),
                            }}
                          >
                            {msg.text}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap">{msg.text}</div>
                      )}
                      <div
                        className={`text-[10px] mt-1 text-right ${
                          msg.role === "user" ? "text-blue-200" : "text-slate-400"
                        }`}
                      >
                        {msg.time}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {loading && (
                  <div className="flex items-start gap-2.5">
                    <div className="h-7 w-7 rounded-full bg-white text-[#1b365d] border border-slate-200 shadow-xs flex items-center justify-center shrink-0">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                    <div className="bg-white text-slate-600 border border-slate-200 rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-[#1b365d] animate-bounce [animation-delay:-0.3s]" />
                        <span className="h-2 w-2 rounded-full bg-[#1b365d] animate-bounce [animation-delay:-0.15s]" />
                        <span className="h-2 w-2 rounded-full bg-[#1b365d] animate-bounce" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Suggestion Chips (shown when few messages) */}
              {messages.length <= 2 && !loading && (
                <div className="px-3 py-2 bg-slate-100/70 border-t border-slate-200/70 flex flex-wrap gap-1.5">
                  {QUICK_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(prompt)}
                      className="text-[11px] bg-white hover:bg-slate-100 text-slate-700 hover:text-[#1b365d] border border-slate-200 hover:border-slate-300 rounded-full px-2.5 py-1 transition-all text-left truncate max-w-full shadow-2xs cursor-pointer"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}

              {/* Input Footer */}
              <div className="p-3 bg-white border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Tanya seputar layanan atau informasi kelurahan..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1b365d] focus:bg-white transition-all placeholder:text-slate-400"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!input.trim() || loading}
                    className="h-9 w-9 rounded-full bg-[#1b365d] hover:bg-[#152a48] disabled:opacity-40 text-white flex items-center justify-center shadow-md transition-all shrink-0 cursor-pointer disabled:cursor-not-allowed"
                    title="Kirim pesan"
                  >
                    <Send className="h-4 w-4 ml-0.5" />
                  </button>
                </div>
                <p className="text-[10px] text-center text-slate-400 mt-2">
                  Didukung oleh Google Gemini • Khusus Layanan Kelurahan Banjar Agung
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer filter drop-shadow-xl hover:drop-shadow-2xl focus:outline-none"
          title="Tanya Kang Arba - Asisten Digital Kelurahan Banjar Agung"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/Arba_Chatbot.png"
            alt="Tanya Kang Arba"
            className="h-16 sm:h-20 w-auto object-contain pointer-events-none"
          />
        </button>
      )}
    </div>
  );
}
