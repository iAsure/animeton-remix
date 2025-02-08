/** @type {import('tailwindcss').Config} */
import { nextui } from "@nextui-org/theme";
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "./node_modules/@nextui-org/theme/dist/components/(button|popover|ripple|spinner).js",
  ],
  prefix: "",
  plugins: [
    require("tailwindcss-animate"),
    nextui({
      themes: {
        "purple-dark": {
          extend: "dark",
          colors: {
            background: "#0D001A",
            foreground: "#ffffff",
            primary: {
              50: "#faf5ff",
              100: "#f3e8ff",
              200: "#e9d5ff",
              300: "#d8b4fe",
              400: "#c084fc",
              500: "#a855f7",
              600: "#9333ea",
              700: "#7e22ce",
              800: "#6b21a8",
              900: "#581c87",
              DEFAULT: "#c084fc",
              foreground: "#0D001A",
            },
            secondary: {
              50: "#FFF0F7",
              100: "#FFE3F0",
              200: "#FFC6E0",
              300: "#FF9ECE",
              400: "#FF77BA",
              500: "#FF4FA6",
              600: "#FF2692",
              700: "#FF007E",
              800: "#D6006A",
              900: "#B30059",
              DEFAULT: "#FF4FA6",
              foreground: "#4A0E2E",
            },
            focus: "#F182F6",
          },
          layout: {
            disabledOpacity: "0.3",
            radius: {
              small: "4px",
              medium: "6px",
              large: "8px",
            },
            borderWidth: {
              small: "1px",
              medium: "2px",
              large: "3px",
            },
          },
        },
      },
    }),
  ],
};

export default config;
