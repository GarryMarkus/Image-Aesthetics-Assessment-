import type { Metadata } from "next";
import { Pixelify_Sans, Space_Grotesk, JetBrains_Mono, Space_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { TelemetryTicker } from "@/components/layout/TelemetryTicker";

const pixelifySans = Pixelify_Sans({
  subsets: ["latin"],
  variable: "--font-pixelify",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PIXEL PRIZE // The Photo Hall & AI Aesthetic Assessment",
  description:
    "Devfolio for photography competitions. AI-evaluated image aesthetics, forensic sensor validation, and master human jury podiums.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${pixelifySans.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} ${spaceMono.variable}`}
    >
      <body className="bg-background text-on-surface font-mono antialiased min-h-screen selection:bg-primary-container selection:text-on-primary-fixed">
        <Header />
        <div className="pt-16">
          <TelemetryTicker />
          <main className="w-full min-h-[calc(100vh-100px)] grid-bg">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
