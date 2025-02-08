import React from "react";

interface FontDisplayProps {
  font: any;
}

export default function FontDisplay({ font }: FontDisplayProps) {
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-semibold mb-4">Typography</h2>
      <p className={`text-xl mb-2 ${font.className}`}>
        This is an example of our primary font: {font.style.fontFamily}
      </p>
      <p className={`text-lg ${font.className}`}>
        ABCDEFGHIJKLMNOPQRSTUVWXYZ
        <br />
        abcdefghijklmnopqrstuvwxyz
        <br />
        0123456789
      </p>
    </section>
  );
}
