import React from "react";
import Image from "next/image";

interface LogoDisplayProps {
  logo: {
    src: string;
    alt: string;
  };
}

export default function LogoDisplay({ logo }: LogoDisplayProps) {
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-semibold mb-4">Logo</h2>
      <div className="bg-background p-4 rounded-md inline-block">
        <Image src={logo.src} alt={logo.alt} width={200} height={100} />
      </div>
    </section>
  );
}
