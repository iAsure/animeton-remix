import { useEffect, useState, useCallback } from 'react';
import { API_BASE_URL } from '@constants/config';

interface CanvasRpcFrameProps {
  imageUrl: string;
}

const useCanvasRpcFrame = ({
  imageUrl,
}: CanvasRpcFrameProps): string | null => {
  const [frame, setFrame] = useState<string | null>(null);

  const genFrame = useCallback(async () => {
    if (!imageUrl) return;
    try {
      const response = await fetch(
        `${API_BASE_URL}/canvas/anime?imageUrl=${encodeURIComponent(imageUrl)}`
      );
      const data = await response.json();
      setFrame(data.url);
    } catch (error) {
      setFrame(null);
    }
  }, [imageUrl]);

  useEffect(() => {
    genFrame();
  }, [genFrame]);

  return frame;
};

export default useCanvasRpcFrame;
