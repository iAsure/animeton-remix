import { Icon } from '@iconify/react';

interface FlagsListProps {
  subtitles?: string;
}

const FlagsList = ({ subtitles }: FlagsListProps) => {
  if (!subtitles) return null;

  const allowedFlags = ['mx', 'es', 'us'] as const;
  
  const uniqueFlags = [...new Set(
    subtitles.match(/\[([a-z]{2})\]/g)
      ?.map(flag => flag.slice(1, -1))
      ?.filter((flag): flag is typeof allowedFlags[number] => 
        allowedFlags.includes(flag as any))
  )] || [];

  if (!uniqueFlags.length) return null;

  return (
    <div className="flex gap-1">
      {uniqueFlags.map(flag => (
        <Icon
          key={`flag-icon-${flag}`}
          icon={`flagpack:${flag}`}
          width={24}
          height={24}
        />
      ))}
    </div>
  );
};

export default FlagsList;
