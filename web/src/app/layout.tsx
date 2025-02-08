import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";

import type { Metadata } from "next";
import { Exo_2 } from "next/font/google";
import { Providers } from "./providers";
import Header from "@/components/ui/layout/Header";
import Footer from "@/components/ui/layout/Footer";

import "./globals.css";
import BackgroundVideo from "@/components/ui/BackgroundVideo";
import { siteConfig } from "@/config/site";
import { branding } from "@/config/branding";

export const metadata: Metadata = {
  title: branding.name,
  description: branding.slogan,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${branding.fonts.primary.className} flex flex-col min-h-screen`}
      >
        <Providers>
          <div className="purple-dark text-foreground bg-background">
            <div className="flex flex-col min-h-screen">
              <Header />
              <BackgroundVideo
                videoSrc={siteConfig.links.video}
                opacity={0.7}
                filter="brightness(40%) blur(2px)"
              />
              <main className="flex-grow mt-12 md:mt-16 bg-gradient-to-br from-background via-primary-900/10 to-secondary-900/10 z-[1]">
                {children}
              </main>
            </div>
            <Footer />
          </div>
          <SpeedInsights />
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
