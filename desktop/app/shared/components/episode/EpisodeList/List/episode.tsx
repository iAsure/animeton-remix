import { memo, MouseEvent } from 'react';
import { Icon } from '@iconify/react';
import { Card, CardBody, Image } from '@nextui-org/react';
import { motion } from 'framer-motion';

interface EpisodeCardProps {
  episode: any;
  isLoading: boolean;
  onPlay: (episode: any) => void;
  isNew: boolean;
  animeColors: string[];
  textColor: string;
}

const EpisodeCard = memo(({ episode, isLoading, onPlay, isNew, animeColors, textColor }: EpisodeCardProps) => {
  const episodeHasTorrent = !!episode?.torrent;

  const handlePlay = (e: MouseEvent) => {
    e.preventDefault();
    onPlay(episode);
  };

  const episodeTitle = episode?.title?.en || episode?.torrent?.title;
  const episodeSubtitle = episode?.title?.ja || episodeTitle;
  const episodeNumber = episode?.episodeNumber || episode?.episode;
  const episodeDate = episode?.torrent?.date || episode?.airDateUtc || episode?.airDate || episode?.airdate;

  return (
    <motion.div
      onClick={handlePlay}
      viewport={{ once: true, margin: '-1% 0px', amount: 0.1 }}
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ 
        opacity: 1,
        y: 0,
        transition: {
          type: 'spring',
          duration: 0.3,
          bounce: 0.1
        }
      }}
      whileHover={{ scale: 1.05 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20
      }}
      className="will-change-transform"
      style={{
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
      }}
    >
      <Card
        className="w-full h-full relative transition-all duration-300 ease-in-out cursor-pointer group/card rounded-xl border-2"
        style={{
          zIndex: 9000,
          backgroundColor: isNew ? `${animeColors[0]}30` : '#09090b',
          borderColor: isNew ? `${animeColors[0]}80` : '#18181b',
          boxShadow: isNew ? `0 0 20px ${animeColors[0]}` : 'none'
        }}
      >
        <CardBody className="flex flex-row relative gap-4 justify-start overflow-hidden">
          <div className="flex flex-row gap-4 items-center justify-between w-full overflow-hidden">
            <div className="flex flex-row gap-4 items-center flex-grow min-w-0 overflow-hidden">
              <div className="relative min-w-[227px]">
                <Image
                  alt="episode-image"
                  src={episode.image}
                  className={`aspect-video object-cover w-auto h-32 transition-all duration-300 ease-in-out z-20 group-hover/card:brightness-[120%] group-hover/card:blur-[5px] group-hover/card:opacity-70 ${!episodeHasTorrent && 'group-hover/card:grayscale'}`}
                />
                {!episodeHasTorrent && <div
                  className="absolute inset-0 bg-white rounded-2xl z-10"
                />}

                {isNew && <span
                  className="absolute top-0 left-2 mt-2 text-zinc-900 font-medium p-2.5 py-0.5 rounded-full w-fit z-30 opacity-100"
                  style={{
                    backgroundColor: animeColors.at(0),
                    color: textColor,
                  }}
                >
                  NUEVO
                </span>}
                <div
                  className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-in-out z-30 ${isLoading ? 'opacity-70' : 'opacity-0 group-hover/card:opacity-70'}`}
                  style={{
                    zIndex: 9999
                  }}
                >
                  {isLoading ? (
                    <Icon
                      icon="fluent:spinner-ios-16-filled"
                      width="64"
                      height="64"
                      className="animate-spin"
                      style={{ color: '#000' }}
                    />
                  ) : episodeHasTorrent ? (
                    <Icon icon="gravity-ui:play-fill" className="pointer-events-none" width="64" height="64" style={{ color: '#000' }} />
                  ) : (
                    <p className="text-black text-xl font-bold">No disponible...</p>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2 min-w-0 flex-grow overflow-hidden">
                <p className="text-3xl font-medium truncate">
                  {`E${episodeNumber}`}{episodeTitle && ` - ${episodeTitle}`}
                </p>
                <span className="text-xl text-gray-400 truncate">{episodeSubtitle}</span>
              </div>
            </div>

            <div className="flex flex-col gap-6 justify-between items-end">
              <div className="flex flex-row gap-1">
                <span className="text-base text-gray-400">
                  {episode.rating || 'N/A'}
                </span>
                <Icon
                  icon="gravity-ui:star"
                  width="16"
                  height="16"
                  className="text-gray-400"
                  style={{ marginTop: 4 }}
                />
              </div>
              <div className="flex flex-row gap-1">
                <span className="text-base text-gray-400">
                  {episode.length || '??'}
                  {' mins'}
                </span>
                <Icon
                  icon="gravity-ui:clock"
                  width="16"
                  height="16"
                  className="text-gray-400"
                  style={{ marginTop: 5 }}
                />
              </div>
              <div className="flex flex-row gap-1">
                <span className="text-base text-gray-400">
                  {new Date(episodeDate).toLocaleDateString() || 'N/A'}
                </span>
                <Icon
                  icon="gravity-ui:calendar"
                  width="16"
                  height="16"
                  className="text-gray-400"
                  style={{ marginTop: 4 }}
                />
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
});

export default EpisodeCard;
