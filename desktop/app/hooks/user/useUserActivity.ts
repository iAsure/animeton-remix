import { useCallback, useEffect, useState } from 'react';

interface WatchProgress {
  timeStamp: number;
  duration: number;
  progress: number;
  completed: boolean;
  lastWatched: number;
}

interface EpisodeHistory {
  animeName: string;
  animeImage: string;
  animeIdAnilist: number;
  episodeImage: string;
  episodeNumber: number;
  episodeTorrentUrl: string;
  episodeFileName: string;
  pubDate: string;
  progressData: WatchProgress;
}

interface WatchHistory {
  lastUpdated: number;
  episodes: {
    [id: string]: EpisodeHistory;
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
    async (
      episodeId: string, 
      progress: number, 
      duration: number,
      episodeInfo: Omit<EpisodeHistory, 'progressData'>
    ) => {
      await window.api.history.updateProgress(episodeId, progress, duration, episodeInfo);
    },
    []
  );

  const getEpisodeProgress = useCallback(
    async (episodeId: string): Promise<EpisodeHistory | undefined> => {
      return await window.api.history.getProgress(episodeId);
    },
    []
  );

  const clearHistory = useCallback(async () => {
    await window.api.history.clear();
  }, []);

  const isEpisodeCompleted = useCallback(
    (episodeId: string): boolean => {
      return !!history?.episodes[episodeId]?.progressData.completed;
    },
    [history]
  );

  const getLastWatchedEpisodes = useCallback(
    (limit = 10) => {
      if (!history) return [];

      return Object.entries(history.episodes)
        .sort((a, b) => b[1].progressData.lastWatched - a[1].progressData.lastWatched)
        .slice(0, limit)
        .map(([id, episode]) => ({
          episodeId: id,
          ...episode,
        }));
    },
    [history]
  );

  const getWatchedCount = useCallback((): number => {
    if (!history) return 0;
    return Object.values(history.episodes).filter(
      (ep) => ep.progressData.completed
    ).length;
  }, [history]);

  const getInProgressEpisodes = useCallback(() => {
    if (!history) return [];

    return Object.entries(history.episodes)
      .filter(
        ([_, episode]) => 
          episode.progressData.progress > 0 && 
          !episode.progressData.completed
      )
      .sort(
        (a, b) => 
          b[1].progressData.lastWatched - a[1].progressData.lastWatched
      )
      .map(([id, episode]) => ({
        episodeId: id,
        ...episode,
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
