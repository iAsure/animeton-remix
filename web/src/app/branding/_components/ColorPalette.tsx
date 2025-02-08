import React from "react";
import { CopyToClipboard } from "./CopyToClipboard";
import { BrandingColors } from "@/types/branding";
interface ColorSwatchProps {
  color: string;
  name: string;
}

const ColorSwatch: React.FC<ColorSwatchProps> = ({ color, name }) => (
  <div className="mb-4">
    <div
      className="w-full h-20 rounded-md mb-2"
      style={{ backgroundColor: color }}
    ></div>
    <p className="font-semibold">{name}</p>
    <CopyToClipboard text={color} />
    <CopyToClipboard text={hexToRgb(color) || ""} />
  </div>
);

const hexToRgb = (hex: string): string | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})`
    : null;
};

interface ColorPaletteProps {
  colors: BrandingColors;
}

export default function ColorPalette({ colors }: ColorPaletteProps) {
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-semibold mb-4">Color Palette</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(colors).map(([name, color]) => {
          if (typeof color === "object") {
            return Object.entries(color).map(([subName, subColor]) => (
              <ColorSwatch
                key={`${name}-${subName}`}
                color={subColor as string}
                name={`${name}-${subName}`}
              />
            ));
          }
          return <ColorSwatch key={name} color={color} name={name} />;
        })}
      </div>
    </section>
  );
}
