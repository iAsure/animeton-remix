import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Tooltip,
} from '@nextui-org/react';
import { Icon } from '@iconify/react';

import { timeAgo } from '@utils/strings';
import { getNeonColor } from '@utils/colors';

import useExtractColor from '@hooks/useExtractColor';

import FlagsList from '@components/decoration/FlagsList';

interface CoverImage {
  extraLarge?: string;
}

interface Episode {
  image?: string;
  episodeNumber?: number;
  runtime?: number;
  length?: number;
  episode?: number;
}

interface Torrent {
  link: string;
  episode?: number;
  subtitles?: string[];
  pubDate?: string;
}

interface AnimeTitle {
  romaji: string;
}

interface AnimeProps {
  idAnilist: number;
  title: AnimeTitle;
  episode?: Episode;
  bannerImage?: string;
  coverImage?: CoverImage;
  duration?: number;
  torrent?: Torrent;
  torrentHevc?: {
    pubDate?: string;
  };
}

interface EpisodeCardProps {
  anime: AnimeProps | any;
  isLoading: boolean;
  onPlay: () => void;
}

const EpisodeCard = memo(({ anime, isLoading, onPlay }: EpisodeCardProps) => {
  const navigate = useNavigate();

  const episodeImage =
    anime?.episode?.image ||
    anime?.bannerImage ||
    anime?.coverImage?.extraLarge;

  const episodeDuration =
    anime?.duration || anime?.episode?.runtime || anime?.episode?.length;
  const episodeTorrentLink = anime?.torrent?.link.toLowerCase();
  const hevcTorrent = anime?.torrentHevc;

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    onPlay();
  };

  const handleIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handlePlay(e);
  };

  const handleAnimeClick = () => {
    navigate(`/anime/${anime.idAnilist}`, {
      state: { title: anime.title.romaji },
    });
  };

  const { animeColors } = useExtractColor(episodeImage);

  if (!animeColors) return null;

  const cardColor = getNeonColor(animeColors[0]);

  return (
    <div className="w-full group">
      <Card className="flex flex-col relative overflow-hidden rounded-md border-1 border-zinc-900 bg-zinc-950/40 transition-all duration-300 hover:scale-[1.02]">
        <div className="aspect-[16/9] w-full relative">
          <CardBody
            className="absolute inset-0 p-0 cursor-pointer"
            onClick={handlePlay}
          >
            <div className="relative w-full h-full">
              <img
                src={episodeImage}
                alt={anime?.title?.romaji}
                className="w-full h-full object-cover object-center transition-all duration-300 group-hover:brightness-75"
                loading="lazy"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
            </div>

            <div
              className="absolute bottom-3 left-3 backdrop-blur-sm bg-zinc-950/20 px-1.5 py-0.5 rounded-lg"
              style={{ zIndex: 1000 }}
            >
              <FlagsList subtitles={anime?.torrent?.subtitles} />
            </div>

            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/50 backdrop-blur-sm z-30">
                <Icon
                  icon="fluent:spinner-ios-16-filled"
                  width="48"
                  height="48"
                  className="animate-spin"
                  style={{ color: cardColor }}
                />
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 bg-zinc-950/30 backdrop-blur-sm transition-all duration-300 group-hover:opacity-100 z-30">
                <div className="transform transition-all duration-300 group-hover:scale-110">
                  <Icon
                    icon="gravity-ui:play-fill"
                    width="48"
                    height="48"
                    style={{ color: cardColor }}
                  />
                </div>
              </div>
            )}
          </CardBody>
        </div>

        <div className="p-4 space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <h3
                className="text-base font-medium line-clamp-1 hover:text-[#ff5680] cursor-pointer transition-colors"
                onClick={handleAnimeClick}
                style={{ zIndex: 1000 }}
              >
                {anime?.title?.romaji}
              </h3>
              <div className="flex gap-2">
                {hevcTorrent && (
                  <Tooltip content="Cargará hasta 3 veces más rápido por usar el códec HEVC">
                    <Icon
                      icon="akar-icons:thunder"
                      className="w-5 h-5 text-primary-400"
                    />
                  </Tooltip>
                )}
                {episodeTorrentLink.includes('(nf)') && (
                  <Tooltip content="Netflix Subs">
                    <Icon
                      icon="streamline:netflix"
                      className="w-5 h-5 text-red-500"
                    />
                  </Tooltip>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-400 transition-opacity duration-100 group-hover:opacity-0">
              Episodio{' '}
              {anime?.torrent?.episode ||
                anime?.episode?.episodeNumber ||
                anime?.episode?.episode ||
                '??'}
            </p>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-zinc-950/90 to-transparent opacity-0 translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
            <div className="flex justify-between items-center text-sm text-gray-300">
              <div className="flex items-center gap-1.5">
                <Icon icon="gravity-ui:calendar" className="w-4 h-4" />
                <span>
                  {timeAgo(
                    anime?.torrentHevc?.pubDate || anime?.torrent?.pubDate
                  )}
                </span>
              </div>
              {episodeDuration && (
                <div className="flex items-center gap-1.5">
                  <Icon icon="gravity-ui:clock" className="w-4 h-4" />
                  <span>{episodeDuration} mins</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
});

export default EpisodeCard;
