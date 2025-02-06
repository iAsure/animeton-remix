import { useEffect, useCallback, useState } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@nextui-org/react';

import usePlayerStore from '@stores/player';

import { useConfig } from '@context/ConfigContext';

import { videoFormatTime } from '@utils/strings';

import SubtitleSelector from '@components/video/SubtitleSelector';
import Timeline from '@components/video/Timeline';

import { IPC_CHANNELS } from '@electron/constants/event-channels';

interface VideoControlsProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  chapters: any[];
}

const VideoControls = ({ videoRef, chapters }: VideoControlsProps) => {
  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    isFullscreen,
    isMouseMoving,
    setIsPlaying,
    setPlaybackState,
    setVolume,
    setFullscreen,
    setPlayLastAction,
    availableSubtitles,
    subtitleRanges,
    torrentRanges,
  } = usePlayerStore();
  const { config } = useConfig();

  const [showSubtitleSelector, setShowSubtitleSelector] = useState(false);
  const [showSkipButton, setShowSkipButton] = useState(true);
  const [previousVolume, setPreviousVolume] = useState(1);

  const currentChapter = chapters.find(
    chapter => currentTime >= chapter.start/1000 && currentTime <= chapter.end/1000
  );

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', handleDragEnd);
  }, []);

  const handleDrag = useCallback(
    (e: MouseEvent) => {
      const video = videoRef.current;
      if (!video) return;

      const progressBar = document.querySelector('.progress-bar-container');
      if (!progressBar) return;

      const bounds = progressBar.getBoundingClientRect();
      const percent = Math.min(
        Math.max((e.clientX - bounds.left) / bounds.width, 0),
        1
      );

      video.currentTime = percent * video.duration;
    },
    [videoRef]
  );

  const handleDragEnd = useCallback(() => {
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', handleDragEnd);
  }, [handleDrag]);

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('mouseup', handleDragEnd);
    };
  }, [handleDrag]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => {
      setPlaybackState(video.currentTime, video.duration);
    };

    const updatePlayingState = () => {
      setIsPlaying(!video.paused);
    };

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('play', updatePlayingState);
    video.addEventListener('pause', updatePlayingState);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('play', updatePlayingState);
      video.removeEventListener('pause', updatePlayingState);
    };
  }, [videoRef, setPlaybackState, setIsPlaying]);

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      setPlayLastAction('play');
      setIsPlaying(true);
      video.play();
    } else {
      setPlayLastAction('pause');
      setIsPlaying(false);
      video.pause();
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video) return;

      if (
        e.target === document.body && 
        ['Space', 'ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.code)
      ) {
        e.preventDefault();
      }

      if (e.target === document.body) {
        switch (e.code) {
          case 'Space':
            handlePlayPause();
            break;
          case 'ArrowRight':
            video.currentTime += e.altKey ? 5 : 1;
            break;
          case 'ArrowLeft':
            video.currentTime -= e.altKey ? 5 : 1;
            break;
          case 'ArrowDown':
            const newVolDown = Math.max(0, video.volume - 0.05);
            video.volume = newVolDown;
            setVolume(newVolDown);
            break;
          case 'ArrowUp':
            const newVolUp = Math.min(1, video.volume + 0.05);
            video.volume = newVolUp;
            setVolume(newVolUp);
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [videoRef, handlePlayPause, setVolume]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const bounds = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - bounds.left) / bounds.width;
    video.currentTime = percent * video.duration;
  };

  const handleFullScreen = useCallback(() => {
    window.electron.ipc.send(IPC_CHANNELS.WINDOW.SET_FULLSCREEN, !isFullscreen);
  }, [isFullscreen]);

  // Listen for fullscreen changes from Electron
  useEffect(() => {
    const handleFullscreenChange = (_: any, isFullscreen: boolean) => {
      setFullscreen(isFullscreen);
    };

    window.electron.ipc.on(IPC_CHANNELS.WINDOW.FULLSCREEN_CHANGE, handleFullscreenChange);

    return () => {
      window.electron.ipc.removeListener(
        IPC_CHANNELS.WINDOW.FULLSCREEN_CHANGE,
        handleFullscreenChange
      );
    };
  }, []);

  const handleVolumeScroll = useCallback(
    (e: WheelEvent) => {
      const video = videoRef.current;
      if (!video) return;

      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      const newVolume = Math.max(0, Math.min(1, video.volume + delta));

      video.volume = newVolume;
      setVolume(newVolume);
    },
    [videoRef, setVolume]
  );

  // Add event listener for wheel event
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.addEventListener('wheel', handleVolumeScroll, { passive: false });

    return () => {
      video.removeEventListener('wheel', handleVolumeScroll);
    };
  }, [handleVolumeScroll]);

  // Close subtitle selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element)?.closest('.subtitle-selector-container')) {
        setShowSubtitleSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const rangeInput = document.querySelector('input[type="range"]');
    if (rangeInput) {
      (rangeInput as HTMLElement).style.setProperty(
        '--value-percent',
        volume.toString()
      );
    }
  }, [volume]);

  const SKIPPABLE_CHAPTERS = [
    ['Opening', /^op$|opening$|^ncop/i],
    ['Ending', /^ed$|ending$|^nced/i],
    ['Recap', /^(?!.*end).*recap.*/i]
  ] as const;

  const getSkippableChapterType = useCallback((chapter?: any) => {
    if (!chapter?.text) return null;
    
    for (const [type, regex] of SKIPPABLE_CHAPTERS) {
      if (regex.test(chapter.text)) {
        return type;
      }
    }
    return null;
  }, []);

  const handleSkipChapter = () => {
    if (!videoRef.current || !currentChapter) return;
    videoRef.current.currentTime = currentChapter.end/1000;
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (getSkippableChapterType(currentChapter)) {
      setShowSkipButton(true);
      timeoutId = setTimeout(() => {
        setShowSkipButton(false);
      }, 10000);
    } else {
      setShowSkipButton(false);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [currentChapter?.start, getSkippableChapterType]);

  const getSkipButtonText = (chapterType: string) => {
    switch (chapterType) {
      case 'Opening': return 'Saltar intro';
      case 'Ending': return 'Saltar ending';
      case 'Recap': return 'Saltar recap';
      default: return 'Saltar';
    }
  };

  const handleVolumeClick = () => {
    const video = videoRef.current;
    if (!video) return;

    if (volume > 0) {
      setPreviousVolume(volume);
      video.volume = 0;
      setVolume(0);
    } else {
      const newVolume = previousVolume === 0 ? 1 : previousVolume;
      video.volume = newVolume;
      setVolume(newVolume);
    }
  };

  return (
    <>
      <Button
        className="fixed right-10 bottom-24 bg-white text-black text-base font-extrabold shadow-sm rounded-lg"
        onClick={handleSkipChapter}
        isDisabled={!currentChapter || !getSkippableChapterType(currentChapter)}
        style={{
          opacity: (getSkippableChapterType(currentChapter) && showSkipButton) ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
          height: '36px',
          zIndex: 1000,
        }}
      >
        <Icon icon="gravity-ui:chevrons-right" className="text-black h-5 w-5" />
        {getSkipButtonText(getSkippableChapterType(currentChapter) || '')}
      </Button>

      <div
        className="fixed bottom-0 w-full bg-gradient-to-t from-black/95 to-transparent"
        style={{
          opacity: isMouseMoving ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
          zIndex: 1000,
        }}
      >
        {/* Subtitle ranges indicator */}
        {config?.features?.subtitlesIndicator && (
          <div className="w-full h-0.5 bg-transparent mb-5">
            {subtitleRanges.map((range, index) => (
              <div
                key={index}
                className="absolute h-3"
                style={{
                  left: `${(range.start / duration) * 100}%`,
                  width: `${((range.end - range.start) / duration) * 100}%`,
                  background:
                    'linear-gradient(to bottom, rgba(59, 130, 246, 0.7), rgba(0, 0, 0, 0))',
                }}
              />
            ))}
          </div>
        )}

        <Timeline
          currentTime={currentTime}
          duration={duration}
          chapters={chapters}
          torrentRanges={torrentRanges}
          onSeek={handleSeek}
          onDragStart={handleDragStart}
        />

        {/* Controls */}
        <div className="flex items-center justify-between px-4 h-16">
          {/* Left controls */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handlePlayPause}
              className="p-2 text-white/90 hover:text-white hover:scale-125 transition-all"
            >
              <Icon
                icon={
                  isPlaying ? 'fluent:pause-48-filled' : 'fluent:play-48-filled'
                }
                className="pointer-events-none"
                width="32"
                height="32"
              />
            </button>

            {/* Volume control */}
            <div className="flex items-center space-x-2">
              <button onClick={handleVolumeClick}>
                <Icon
                  icon={volume === 0 ? "fluent:speaker-mute-24-filled" : "fluent:speaker-2-24-filled"}
                  className="text-white/90 pointer-events-none hover:text-white transition-all"
                  width="24"
                  height="24"
                />
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={handleVolumeChange}
                className="w-24 h-1 rounded-full appearance-none cursor-pointer
                 bg-white/25
                 [&::-webkit-slider-runnable-track]:bg-transparent
                 [&::-moz-range-track]:bg-transparent
                 [&::-webkit-slider-thumb]:appearance-none
                 [&::-webkit-slider-thumb]:w-3
                 [&::-webkit-slider-thumb]:h-3
                 [&::-webkit-slider-thumb]:rounded-full
                 [&::-webkit-slider-thumb]:bg-[#ff5680]
                 [&::-moz-range-thumb]:bg-[#ff5680]
                 [&::-moz-range-thumb]:border-none
                 [&::-webkit-progress-value]:bg-[#ff5680]
                 [&::-moz-range-progress]:bg-[#ff5680]
                 relative
                 before:absolute before:h-full before:bg-[#ff5680] 
                 before:rounded-l-full before:content-[''] 
                 before:left-0 before:top-0
                 before:[width:calc(100%*var(--value-percent))]"
              />
            </div>

            {/* Time display */}
            <div className="text-white/90 text-sm">
              {videoFormatTime(currentTime)} / {videoFormatTime(duration)}
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center space-x-4">
            {/* Subtitles button */}
            <div className="relative subtitle-selector-container">
              <button
                className="p-2 text-white/90 hover:text-white transition-all"
                onClick={() => setShowSubtitleSelector(!showSubtitleSelector)}
                disabled={availableSubtitles.length === 0}
              >
                <Icon
                  icon="mingcute:subtitle-fill"
                  className={`pointer-events-none ${
                    availableSubtitles.length === 0 ? 'opacity-50' : ''
                  }`}
                  width="24"
                  height="24"
                />
              </button>
              {showSubtitleSelector && <SubtitleSelector />}
            </div>

            {/* Fullscreen button */}
            <button
              onClick={handleFullScreen}
              className="p-2 text-white/90 hover:text-white transition-all"
            >
              <Icon
                icon={
                  isFullscreen
                    ? 'mingcute:fullscreen-exit-fill'
                    : 'mingcute:fullscreen-fill'
                }
                className="pointer-events-none"
                width="24"
                height="24"
              />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default VideoControls;
