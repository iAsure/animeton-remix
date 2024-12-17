import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';

interface VideoControlsProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isMouseMoving: boolean;
}

const VideoControls = ({ videoRef, isMouseMoving }: VideoControlsProps) => {
  const [videoState, setVideoState] = useState({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    isFullscreen: false,
  });

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', handleDragEnd);
  }, []);

  const handleDrag = useCallback((e: MouseEvent) => {
    const video = videoRef.current;
    if (!video) return;

    const progressBar = document.querySelector('.progress-bar-container');
    if (!progressBar) return;

    const bounds = progressBar.getBoundingClientRect();
    const percent = Math.min(Math.max((e.clientX - bounds.left) / bounds.width, 0), 1);
    
    video.currentTime = percent * video.duration;
    setVideoState(prev => ({
      ...prev,
      currentTime: video.currentTime
    }));
  }, [videoRef]);

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
      setVideoState(prev => ({
        ...prev,
        currentTime: video.currentTime,
        duration: video.duration
      }));
    };

    const updatePlayingState = () => {
      setVideoState(prev => ({
        ...prev,
        isPlaying: !video.paused
      }));
    };

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('play', updatePlayingState);
    video.addEventListener('pause', updatePlayingState);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('play', updatePlayingState);
      video.removeEventListener('pause', updatePlayingState);
    };
  }, [videoRef]);

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVideoState(prev => ({ ...prev, volume: newVolume }));
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
    window.electron.ipc.send(
      'window:set-fullscreen',
      !videoState.isFullscreen
    );
  }, [videoState.isFullscreen]);

  // Listen for fullscreen changes from Electron
  useEffect(() => {
    const handleFullscreenChange = (_: any, isFullscreen: boolean) => {
      setVideoState(prev => ({ ...prev, isFullscreen }));
    };

    window.electron.ipc.on('window:fullscreen-change', handleFullscreenChange);

    return () => {
      window.electron.ipc.removeListener('window:fullscreen-change', handleFullscreenChange);
    };
  }, []);

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
            style={{ width: `${(videoState.currentTime / videoState.duration) * 100}%` }}
          />
          {/* Updated Draggable handle */}
          <div
            className="absolute w-2 h-2 group-hover:-top-1.5 -top-0.5 bg-white rounded-full shadow-lg transform -translate-x-1/2
                   group-hover:w-4 group-hover:h-4 transition-all duration-200 cursor-grab"
            style={{ left: `${(videoState.currentTime / videoState.duration) * 100}%` }}
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
              icon={videoState.isPlaying ? 'fluent:pause-48-filled' : 'fluent:play-48-filled'}
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
              value={videoState.volume}
              onChange={handleVolumeChange}
              className="w-24 h-1 bg-white/25 rounded-full appearance-none cursor-pointer"
            />
          </div>

          {/* Time display */}
          <div className="text-white/90 text-sm">
            {formatTime(videoState.currentTime)} / {formatTime(videoState.duration)}
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center space-x-4">
          {/* Subtitles button */}
          <button className="p-2 text-white/90 hover:text-white transition-all">
            <Icon
              icon="mingcute:subtitle-fill"
              className="pointer-events-none"
              width="24"
              height="24"
            />
          </button>

          {/* Fullscreen button */}
          <button
            onClick={handleFullScreen}
            className="p-2 text-white/90 hover:text-white transition-all"
          >
            <Icon
              icon={videoState.isFullscreen ? 'mingcute:fullscreen-exit-fill' : 'mingcute:fullscreen-fill'}
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