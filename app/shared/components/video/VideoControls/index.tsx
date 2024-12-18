import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import usePlayerStore from '@stores/player';

interface VideoControlsProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  loadSubtitlesFromFile: (file: File) => void;
}

const VideoControls = ({
  videoRef,
  loadSubtitlesFromFile,
}: VideoControlsProps) => {
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
  } = usePlayerStore();

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

  // Space key handler
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        handlePlayPause();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

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

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleFullScreen = useCallback(() => {
    window.electron.ipc.send('window:set-fullscreen', !isFullscreen);
  }, [isFullscreen]);

  // Listen for fullscreen changes from Electron
  useEffect(() => {
    const handleFullscreenChange = (_: any, isFullscreen: boolean) => {
      setFullscreen(isFullscreen);
    };

    window.electron.ipc.on('window:fullscreen-change', handleFullscreenChange);

    return () => {
      window.electron.ipc.removeListener(
        'window:fullscreen-change',
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

  return (
    <div
      className="fixed bottom-0 w-full bg-gradient-to-t from-black/95 via-black/75 to-transparent z-50"
      style={{
        opacity: isMouseMoving ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out',
      }}
    >
      {/* Progress bar with draggable handle */}
      <div
        className="w-full h-1 bg-white/5 hover:h-1.5 transition-all duration-200 cursor-pointer group progress-bar-container"
        onClick={handleSeek}
      >
        <div className="relative w-full h-full">
          <div className="absolute w-full h-full bg-white/20" />
          <div
            className="absolute h-full bg-white/60"
            style={{
              width: `${(currentTime / duration) * 100}%`,
            }}
          />
          {/* Updated Draggable handle */}
          <div
            className="absolute w-2 h-2 group-hover:-top-1.5 -top-0.5 bg-white rounded-full shadow-lg transform -translate-x-1/2
                   group-hover:w-4 group-hover:h-4 transition-all duration-200 cursor-grab"
            style={{
              left: `${(currentTime / duration) * 100}%`,
            }}
            onMouseDown={handleDragStart}
          />
          {/* Invisible wider hit area for better UX */}
          <div
            className="absolute h-8 w-full -top-3"
            onMouseDown={handleDragStart}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between px-4 h-16">
        {/* Left controls */}
        <div className="flex items-center space-x-4">
          <button
            onClick={handlePlayPause}
            className="p-2 text-white/90 hover:text-white hover:scale-110 transition-all"
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
            <Icon
              icon="fluent:speaker-2-24-filled"
              className="text-white/90 pointer-events-none"
              width="24"
              height="24"
            />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              className="w-24 h-1 bg-white/25 rounded-full appearance-none cursor-pointer"
            />
          </div>

          {/* Time display */}
          <div className="text-white/90 text-sm">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center space-x-4">
          {/* Subtitles button */}
          <div className="relative">
            <input
              type="file"
              accept=".srt,.ass,.ssa,.vtt"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) loadSubtitlesFromFile(file);
              }}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
              title="Load subtitles"
            />
            <button className="p-2 text-white/90 hover:text-white transition-all">
              <Icon
                icon="mingcute:subtitle-fill"
                className="pointer-events-none"
                width="24"
                height="24"
              />
            </button>
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
  );
};

export default VideoControls;
