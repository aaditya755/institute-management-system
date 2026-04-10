import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { SessionProvider } from "next-auth/react";
import "@/app/globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const favicon = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="16" fill="#0C0C15"/>
  <path d="M14 48V16h8l10 13 10-13h8v32h-8V29l-10 12-10-12v19z" fill="#7C3AED"/>
  <path d="M35 24l7-7 4 4-11 11-6-6 4-4 2 2z" fill="#F59E0B"/>
</svg>
`)}`;

export const metadata: Metadata = {
  title: "Milestone Coaches",
  description: "Every Step Forward Counts",
  icons: {
    icon: favicon,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${jakarta.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-brand-dark text-brand-text antialiased">
        <SessionProvider>
          {children}
          <Toaster theme="dark" richColors position="top-right" />
        </SessionProvider>
      </body>
    </html>
  );
}
