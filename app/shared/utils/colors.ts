export const getContrastColor = (hexColor: string): string => {
  hexColor = hexColor.replace('#', '');

  const r = parseInt(hexColor.substr(0, 2), 16);
  const g = parseInt(hexColor.substr(2, 2), 16);
  const b = parseInt(hexColor.substr(4, 2), 16);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

export const getNeonColor = (hexColor: string): string => {
  let r = parseInt(hexColor.slice(1, 3), 16);
  let g = parseInt(hexColor.slice(3, 5), 16);
  let b = parseInt(hexColor.slice(5, 7), 16);

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  if (max === min) {
    r = 255;
    g = 0;
    b = 0;
  } else {
    const saturationIncrease = 5;
    r = r === max ? 255 : Math.round((r - min) * saturationIncrease);
    g = g === max ? 255 : Math.round((g - min) * saturationIncrease);
    b = b === max ? 255 : Math.round((b - min) * saturationIncrease);
  }

  r = Math.max(Math.min(r, 255), 100);
  g = Math.max(Math.min(g, 255), 100);
  b = Math.max(Math.min(b, 255), 100);

  const neonHex =
    '#' +
    r.toString(16).padStart(2, '0') +
    g.toString(16).padStart(2, '0') +
    b.toString(16).padStart(2, '0');

  return neonHex;
};

interface Color {
  hex: string;
  saturation: number;
  lightness: number;
  intensity: number;
}

export const sortColorsByBrightness = (colors: Color[]): string[] => {
  return colors
    .sort((a, b) => {
      if (
        a.saturation > 0.5 &&
        a.lightness > 0.5 &&
        (b.saturation <= 0.5 || b.lightness <= 0.5)
      ) {
        return -1;
      }
      if (
        b.saturation > 0.5 &&
        b.lightness > 0.5 &&
        (a.saturation <= 0.5 || a.lightness <= 0.5)
      ) {
        return 1;
      }
      return b.intensity - a.intensity;
    })
    .map((color) => color.hex);
};
