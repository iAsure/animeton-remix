import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardBody, CardFooter, Tooltip } from '@nextui-org/react';
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

  const episodeDuration = anime?.duration || anime?.episode?.runtime || anime?.episode?.length;
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
      state: { title: anime.title.romaji }
    });
  };

  const { animeColors } = useExtractColor(episodeImage);

  if (!animeColors) return null;

  const cardColor = getNeonColor(animeColors[0]);

  return (
    <div className="w-full">
      <Card className="flex flex-col relative overflow-hidden rounded-md border border-zinc-900 bg-zinc-950">
        <CardHeader className="flex flex-col truncate items-start justify-start relative p-3">
          <div className="flex w-full items-center justify-between">
            <div className="flex flex-col flex-1 min-w-0">
              <p className="text-base font-medium truncate w-full cursor-pointer" onClick={handleAnimeClick}>
                {anime?.title?.romaji}
              </p>
              <span className="text-sm text-gray-400">
                {`Episodio ${anime?.torrent?.episode || anime?.episode?.episodeNumber || anime?.episode?.episode || '??'}`}
              </span>
            </div>
            {hevcTorrent && <Tooltip content="Cargará hasta 3 veces más rápido por usar el códec HEVC" className="bg-zinc-900 text-white" >
              <Icon
                icon="akar-icons:thunder"
                width="26"
                height="26"
                style={{ color: 'white' }}
                className="ml-2 flex-shrink-0"
              />
            </Tooltip>}
            {episodeTorrentLink.includes('(nf)') && (
              <Tooltip content="Netflix Subs" className="bg-zinc-900 text-white" >
                <Icon
                  icon="streamline:netflix"
                  width="26"
                  height="26"
                  style={{ color: 'white' }}
                  className="ml-2 flex-shrink-0"
                />
              </Tooltip>
            )}

          </div>
        </CardHeader>
        <div className="aspect-[16/9] w-full relative transition-transform duration-300 hover:scale-105">
          <CardBody
            className="absolute inset-0 p-0 cursor-pointer"
            onClick={handlePlay}
          >
            <img
              src={episodeImage}
              alt={anime?.title?.romaji}
              className={`w-full h-full object-cover object-center ${isLoading && 'grayscale'}`}
              loading="lazy"
            />
            <div className="flex flex-row gap-2 bg-slate-950/25 px-1 py-0.5 rounded-md absolute top-2 right-2 z-10">
              <FlagsList subtitles={anime?.torrent?.subtitles} />
            </div>
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center opacity-100 z-30">
                <Icon
                  icon="fluent:spinner-ios-16-filled"
                  width="64"
                  height="64"
                  className="animate-spin"
                  style={{ color: cardColor }}
                />
              </div>
            ) : (
              <div
                className="absolute inset-0 flex items-center justify-center opacity-0 transition duration-300 ease-in-out hover:opacity-70 z-30"
                onClick={handleIconClick}
              >
                <Icon
                  icon="gravity-ui:play-fill"
                  className="pointer-events-none"
                  width="64"
                  height="64"
                  style={{ color: cardColor }}
                />
              </div>
            )}
          </CardBody>
        </div>
        <CardFooter className="p-3">
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center">
              <Icon icon="gravity-ui:calendar" />
              <span className="text-sm text-gray-400 ml-1">
                {timeAgo(anime?.torrentHevc?.pubDate || anime?.torrent?.pubDate)}
              </span>
            </div>
            {episodeDuration && (
              <div className="flex items-center">
                <Icon icon="gravity-ui:clock" />
                <span className="text-sm text-gray-400 ml-1">
                  {`${episodeDuration} mins`}
                </span>
              </div>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
});

export default EpisodeCard;
