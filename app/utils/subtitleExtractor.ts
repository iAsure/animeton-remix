interface Subtitle {
  start: number;
  end: number;
  text: string;
}

interface SubtitleTrack {
  number: number;
  language: string;
  name: string;
  subtitles: Subtitle[];
}

export const extractSubtitles = async (
  filePath: string
): Promise<{
  success: boolean;
  data?: SubtitleTrack[];
  error?: string;
}> => {
  return window.api.extractSubtitles(filePath);
};
