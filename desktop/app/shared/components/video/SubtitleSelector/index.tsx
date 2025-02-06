import { useCallback } from 'react';
import usePlayerStore from '@stores/player';
import SubtitleItem from './SubtitleItem';

const SubtitleSelector = () => {
  const { 
    availableSubtitles, 
    selectedSubtitleTrack, 
    setSelectedSubtitleTrack,
    setSubtitleContent 
  } = usePlayerStore();

  const handleSubtitleSelect = useCallback((subtitle: any | null) => {
    setSelectedSubtitleTrack(subtitle);
    
    if (subtitle) {
      setSubtitleContent(subtitle.parsedContent);
    } else {
      setSubtitleContent('');
    }
  }, [setSelectedSubtitleTrack, setSubtitleContent]);

  const isSubtitleSelected = useCallback((subtitle: any) => {
    if (!selectedSubtitleTrack) return false;
    
    if (subtitle.source === 'api' && selectedSubtitleTrack.source === 'api') {
      return true;
    }
    
    return selectedSubtitleTrack.track?.number === subtitle.track?.number;
  }, [selectedSubtitleTrack]);

  const subtitles = Array.isArray(availableSubtitles) ? availableSubtitles : [];

  return (
    <ul
      className="absolute bottom-16 right-8 bg-zinc-900 rounded-lg shadow-lg backdrop-blur-sm border border-zinc-800 min-w-[200px] py-2"
      style={{ zIndex: 9999 }}
    >
      {subtitles.map((subtitle, ix) => (
        <SubtitleItem
          key={ix}
          isSelected={isSubtitleSelected(subtitle)}
          label={subtitle.track?.name || `Track ${subtitle.track?.number}`}
          onClick={() => handleSubtitleSelect(subtitle)}
        />
      ))}

      <div className="my-2 border-t border-zinc-800" />

      <SubtitleItem
        isSelected={selectedSubtitleTrack === null}
        label="Sin subtítulos"
        onClick={() => handleSubtitleSelect(null)}
      />
    </ul>
  );
};

export default SubtitleSelector;