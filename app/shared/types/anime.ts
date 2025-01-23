export interface Anime {
  id: number;
  idAnilist: number;
  idMal?: number;
  title: {
    romaji: string;
    english: string;
    native: string;
  };
  description?: string;
  descriptionTranslated: boolean;
  season?: string;
  seasonYear?: number;
  format?: string;
  status?: string;
  episodes?: number;
  duration?: number;
  genres: string[];
  coverImage: {
    extraLarge: string;
    medium: string;
    color: string;
  };
  bannerImage?: string;
  synonyms: string[];
  nextAiringEpisode?: {
    airingAt: number;
    episode: number;
  };
  startDate: {
    year: number;
    month: number;
    day: number;
  };
  trailer?: {
    id: string;
    site: string;
  };
}

export interface AnimeEpisode {
  idAnilist: number;
  title: {
    romaji: string;
    english: string;
    native: string;
  };
  duration: number | null;
  coverImage: {
    extraLarge: string;
  };
  bannerImage: string | null;
  episode: {
    tvdbShowId: number;
    tvdbId: number;
    seasonNumber: number;
    episodeNumber: number;
    absoluteEpisodeNumber: number;
    title: {
      ja: string;
      en: string;
      'x-jat': string;
    };
    airDate: string;
    airDateUtc: string;
    runtime: number;
    overview?: string;
    image: string;
    episode: string;
    anidbEid: number;
    length: number;
    airdate: string;
    rating?: string;
  };
  torrent: {
    title: string;
    link: string;
    pubDate: string;
    resolution: string;
    linkType: string;
    size: string;
    infoHash: string;
    subtitles: string;
    category: string;
    episode: number;
    isHevc: boolean;
    hasNetflixSubs: boolean;
  };
}

export type AnimeEpisodeList = AnimeEpisode[];
