import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Fira_Code } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const firaCode = Fira_Code({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Kelurahan Banjar Agung - Pemerintah Kota Serang",
  description: "Portal Resmi Pelayanan Publik dan Administrasi Kependudukan Kelurahan Banjar Agung, Kecamatan Cipocok Jaya, Kota Serang, Banten.",
  icons: {
    icon: "/images/logo-kota-serang.png",
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
        className={`${plusJakarta.variable} ${firaCode.variable} antialiased min-h-screen flex flex-col bg-background text-foreground`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
