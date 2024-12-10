import { useEffect, useState, useCallback, useMemo } from 'react';
import { extractColors } from 'extract-colors';
import { getContrastColor, sortColorsByBrightness } from '@utils/colors';

interface Color {
  hex: string;
  red: number;
  green: number;
  blue: number;
  area: number;
  saturation: number;
  lightness: number;
  intensity: number;
}

const useExtractColor = (image: string) => {
  const [animeColors, setAnimeColors] = useState<string[]>(['#000']);
  const [textColor, setTextColor] = useState<string>('#fff');

  const getAnimeColor = useCallback(async () => {
    if (!image) return;
    const colors = await extractColors(image, {
      pixels: 100000,
      distance: 0.15,
      hueDistance: 0.1,
      saturationDistance: 1,
      lightnessDistance: 1,
      crossOrigin: 'anonymous'
    });
    const parsedColors = sortColorsByBrightness(colors as Color[]);
    setAnimeColors(parsedColors);
    setTextColor(getContrastColor(parsedColors[0]));
  }, [image]);

  useEffect(() => {
    getAnimeColor();
  }, [getAnimeColor]);

  return useMemo(() => ({
    animeColors,
    textColor
  }), [animeColors, textColor]);
};

export default useExtractColor;