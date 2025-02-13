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

    const loadImage = (url: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        const timeoutId = setTimeout(() => {
          reject(new Error('Image load timeout'));
        }, 10000);

        img.onload = () => {
          clearTimeout(timeoutId);
          if (img.complete) {
            resolve(img);
          } else {
            reject(new Error('Image not complete after load'));
          }
        };

        img.onerror = (e) => {
          clearTimeout(timeoutId);
          reject(new Error(`Failed to load image: ${e}`));
        };

        const cacheBuster = `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;
        img.src = cacheBuster;
      });
    };

    try {
      const imageElement = await loadImage(image);
      
      if (imageElement.width === 0 || imageElement.height === 0) {
        throw new Error('Image has invalid dimensions');
      }

      const colors = await extractColors(imageElement, {
        pixels: 100000,
        distance: 0.15,
        hueDistance: 0.1,
        saturationDistance: 1,
        lightnessDistance: 1
      });

      if (!colors || colors.length === 0) {
        throw new Error('No colors extracted');
      }

      const parsedColors = sortColorsByBrightness(colors as Color[]);
      setAnimeColors(parsedColors);
      setTextColor(getContrastColor(parsedColors[0]));
    } catch (error) {
      console.error('Error processing image:', error, 'URL:', image);
      setAnimeColors(['#000']);
      setTextColor('#fff');
    }
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