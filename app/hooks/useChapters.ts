import { useState, useEffect } from 'react';
import log from 'electron-log';

const useChapters = () => {
  const [chapters, setChapters] = useState<any[]>([]);
  const [currentChapter, setCurrentChapter] = useState<any | null>(null);

  useEffect(() => {
    const handleChapters = (_, result: { success: boolean; data: any[] }) => {
      if (result.success) {
        setChapters(result.data);
      }
    };

    window.api.chapters.onExtracted.subscribe(handleChapters);
    return () => window.api.chapters.onExtracted.unsubscribe(handleChapters);
  }, []);

  const findChapterAtTime = (time: number) => {
    if (!chapters.length) return null;

    const currentChapter = chapters.reduce((prev, current) => {
      if (current.time <= time && (!prev || current.time > prev.time)) {
        return current;
      }
      return prev;
    }, null as any | null);

    setCurrentChapter(currentChapter);
    return currentChapter;
  };

  const seekToChapter = (chapter: any) => {
    const video = document.querySelector('video');
    if (video) {
      video.currentTime = chapter.time;
      setCurrentChapter(chapter);
    }
  };

  return {
    chapters,
    currentChapter,
    findChapterAtTime,
    seekToChapter
  };
};

export default useChapters; 