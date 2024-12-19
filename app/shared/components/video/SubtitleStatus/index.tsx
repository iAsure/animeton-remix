import usePlayerStore from '@stores/player';
import { Icon } from '@iconify/react';

const SubtitleStatus = () => {
  const { 
    subtitleStatus,
    availableSubtitles,
    subtitleRanges 
  } = usePlayerStore();

  return (
    <div className="absolute top-20 left-4 bg-black/80 text-white px-4 py-3 rounded-md text-sm font-medium z-50 max-w-md">
      <div className="space-y-2">
        {/* Status Indicator */}
        <div className={`flex items-center gap-2 ${
          subtitleStatus?.status === 'ready' ? 'text-green-400' :
          subtitleStatus?.status === 'error' ? 'text-red-400' : 'text-white'
        }`}>
          {subtitleStatus?.status === 'loading' && (
            <Icon icon="mdi:loading" className="w-5 h-5 animate-spin" />
          )}
          {subtitleStatus?.status === 'ready' && (
            <Icon icon="mdi:check-circle" className="w-5 h-5" />
          )}
          {subtitleStatus?.status === 'error' && (
            <Icon icon="mdi:alert-circle" className="w-5 h-5" />
          )}
          <span>{subtitleStatus?.message || 'No hay subtítulos cargados'}</span>
        </div>

        {/* Subtitle Info */}
        <div className="space-y-1.5 text-xs text-gray-300">
          {/* Available Tracks */}
          <div className="flex items-center gap-2">
            <span>{availableSubtitles.length} pistas disponibles</span>
          </div>

          {/* Ranges Info */}
          {subtitleRanges.length > 0 && (
            <div className="flex items-center gap-2">
              <span>{subtitleRanges.length} segmentos de subtítulos</span>
            </div>
          )}
        </div>

        {/* Error Details */}
        {subtitleStatus?.status === 'error' && subtitleStatus.message && (
          <div className="mt-2 text-xs text-red-300 border-t border-red-400/30 pt-2">
            {subtitleStatus.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubtitleStatus;