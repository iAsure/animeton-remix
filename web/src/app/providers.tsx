// app/providers.tsx
"use client";

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { NextUIProvider } from "@nextui-org/react";

if (typeof window !== "undefined") {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    throw new Error("NEXT_PUBLIC_POSTHOG_KEY is not set");
  }

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    person_profiles: "always",
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextUIProvider>
      <PostHogProvider client={posthog}>{children}</PostHogProvider>
    </NextUIProvider>
  );
}
