"use client";

import React, { useState } from "react";
import { Button } from "@nextui-org/button";

interface CopyToClipboardProps {
  text: string;
}

export function CopyToClipboard({ text }: CopyToClipboardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button size="sm" onClick={handleCopy}>
      {copied ? "¡Copiado!" : "Copiar"}
    </Button>
  );
}
