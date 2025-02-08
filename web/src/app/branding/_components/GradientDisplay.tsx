import React from "react";
import { branding } from "@/config/branding";

const gradients = [
  // @ts-ignore
  `linear-gradient(to right, ${branding.colors.primary.DEFAULT}, ${branding.colors.secondary.DEFAULT})`,
  // @ts-ignore
  `linear-gradient(to right, ${branding.colors.background}, ${branding.colors.foreground})`,
  // Añade más gradientes según sea necesario
];

export default function GradientDisplay() {
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-semibold mb-4">Gradients</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {gradients.map((gradient, index) => (
          <div
            key={index}
            className="h-32 rounded-md"
            style={{ background: gradient }}
          ></div>
        ))}
      </div>
    </section>
  );
}
