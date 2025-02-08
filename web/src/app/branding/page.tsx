import React from "react";
import { branding } from "@/config/branding";
import FontDisplay from "./_components/FontDisplay";
import LogoDisplay from "./_components/LogoDisplay";
import ColorPalette from "./_components/ColorPalette";
import GradientDisplay from "./_components/GradientDisplay";
import { BrandingColors } from "@/types/branding";

export default function BrandingPage() {
  console.log("branding.colors", branding.colors);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">{branding.name} Branding</h1>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Slogan</h2>
        <p className="text-xl">{branding.slogan}</p>
      </section>

      <FontDisplay font={branding.fonts.primary} />

      <LogoDisplay logo={branding.logo} />

      <ColorPalette colors={branding.colors} />

      <GradientDisplay />
    </div>
  );
}
