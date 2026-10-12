import type { Metadata } from "next";
import { Inter, Fira_Code } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const firaCode = Fira_Code({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kelurahan Banjar Agung - Pemerintah Kota Serang",
  description: "Portal Resmi Pelayanan Publik dan Administrasi Kependudukan Kelurahan Banjar Agung, Kecamatan Cipocok Jaya, Kota Serang, Banten.",
  icons: {
    icon: [
      { url: "/images/logo-kota-serang.png", type: "image/png" },
    ],
    shortcut: "/images/logo-kota-serang.png",
    apple: "/images/logo-kota-serang.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var obs = new MutationObserver(function(mutations) {
                    for (var i = 0; i < mutations.length; i++) {
                      var m = mutations[i];
                      if (m.type === 'attributes' && m.attributeName) {
                        var name = m.attributeName;
                        if ((name.indexOf('bis_') === 0 || name.indexOf('__processed_') === 0) && m.target.hasAttribute(name)) {
                          m.target.removeAttribute(name);
                        }
                      }
                    }
                  });
                  obs.observe(document.documentElement, {
                    attributes: true,
                    subtree: true
                  });
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${firaCode.variable} antialiased min-h-screen flex flex-col bg-background text-foreground`}
      >
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
