import { useCallback, useEffect, useState } from 'react';

interface WatchProgress {
  timeStamp: number;
  duration: number;
  progress: number;
  completed: boolean;
  lastWatched: number;
}

interface WatchHistory {
  lastUpdated: number;
  episodes: {
    [id: string]: WatchProgress;
  };
}

const useUserActivity = () => {
  const [history, setHistory] = useState<WatchHistory | null>(null);

  useEffect(() => {
    window.api.history.getAll().then(setHistory);

    const historyHandler = (_: any, newHistory: WatchHistory) => {
      setHistory(newHistory);
    };

    window.api.history.onChanged.subscribe(historyHandler);
    return () => {
      window.api.history.onChanged.unsubscribe(historyHandler);
    };
  }, []);

  const updateProgress = useCallback(
    async (episodeId: string, progress: number, duration: number) => {
      await window.api.history.updateProgress(episodeId, progress, duration);
    },
    []
  );

  const getEpisodeProgress = useCallback(
    async (episodeId: string): Promise<WatchProgress | undefined> => {
      return await window.api.history.getProgress(episodeId);
    },
    []
  );

  const clearHistory = useCallback(async () => {
    await window.api.history.clear();
  }, []);

  const isEpisodeCompleted = useCallback(
    (episodeId: string): boolean => {
      return !!history?.episodes[episodeId]?.completed;
    },
    [history]
  );

  const getLastWatchedEpisodes = useCallback(
    (limit = 10) => {
      if (!history) return [];

      return Object.entries(history.episodes)
        .sort((a, b) => b[1].lastWatched - a[1].lastWatched)
        .slice(0, limit)
        .map(([id, progress]) => ({
          episodeId: id,
          ...progress,
        }));
    },
    [history]
  );

  const getWatchedCount = useCallback((): number => {
    if (!history) return 0;
    return Object.values(history.episodes).filter((ep) => ep.completed).length;
  }, [history]);

  const getInProgressEpisodes = useCallback(() => {
    if (!history) return [];

    return Object.entries(history.episodes)
      .filter(([_, progress]) => progress.progress > 0 && !progress.completed)
      .sort((a, b) => b[1].lastWatched - a[1].lastWatched)
      .map(([id, progress]) => ({
        episodeId: id,
        ...progress,
      }));
  }, [history]);

  return {
    history,
    updateProgress,
    getEpisodeProgress,
    clearHistory,
    isEpisodeCompleted,
    getLastWatchedEpisodes,
    getWatchedCount,
    getInProgressEpisodes,
  };
};

export default useUserActivity;
