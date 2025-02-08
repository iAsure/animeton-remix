import { Exo_2 } from "next/font/google";
import resolveConfig from "tailwindcss/resolveConfig";
import tailwindConfig from "../../tailwind.config";

const exo2 = Exo_2({ subsets: ["latin"] });

const fullConfig = resolveConfig(tailwindConfig);
const allColors = fullConfig.theme?.colors as any;

// Función para resolver colores
const resolveColor = (color: any): string => {
  if (typeof color === "function") {
    return color({});
  }
  return color;
};

// Extraer los colores específicos que queremos, incluyendo todas las tonalidades
const colors = {
  background: resolveColor(allColors.background),
  foreground: resolveColor(allColors.foreground),
  primary: {
    50: resolveColor(allColors.primary?.[50]),
    100: resolveColor(allColors.primary?.[100]),
    200: resolveColor(allColors.primary?.[200]),
    300: resolveColor(allColors.primary?.[300]),
    400: resolveColor(allColors.primary?.[400]),
    500: resolveColor(allColors.primary?.[500]),
    600: resolveColor(allColors.primary?.[600]),
    700: resolveColor(allColors.primary?.[700]),
    800: resolveColor(allColors.primary?.[800]),
    900: resolveColor(allColors.primary?.[900]),
    DEFAULT: resolveColor(allColors.primary?.DEFAULT),
    foreground: resolveColor(allColors.primary?.foreground),
  },
  secondary: {
    50: resolveColor(allColors.secondary?.[50]),
    100: resolveColor(allColors.secondary?.[100]),
    200: resolveColor(allColors.secondary?.[200]),
    300: resolveColor(allColors.secondary?.[300]),
    400: resolveColor(allColors.secondary?.[400]),
    500: resolveColor(allColors.secondary?.[500]),
    600: resolveColor(allColors.secondary?.[600]),
    700: resolveColor(allColors.secondary?.[700]),
    800: resolveColor(allColors.secondary?.[800]),
    900: resolveColor(allColors.secondary?.[900]),
    DEFAULT: resolveColor(allColors.secondary?.DEFAULT),
    foreground: resolveColor(allColors.secondary?.foreground),
  },
  focus: resolveColor(allColors.focus),
};

export const branding = {
  name: "AniTorrent",
  slogan: "La App de Windows para ver anime en Español",
  colors,
  fonts: {
    primary: exo2,
  },
  logo: {
    // Placeholder para el logo
    src: "/path/to/logo.svg",
    alt: "AniTorrent Logo",
  },

  icon: {
    // Placeholder para el icono
    src: "/path/to/icon.png",
    sizes: [16, 32, 64, 128, 256],
  },
  socialMedia: {
    discord: "https://dsc.gg/anitorrent",
    instagram: "https://instagram.com/animeton_la",
    tiktok: "https://tiktok.com/@animeton_la",
    youtube: "https://youtube.com/@animeton_la",
  },
};

// Tipo para los colores de branding
export type BrandingColors = typeof colors;
