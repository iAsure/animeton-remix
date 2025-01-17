interface Chapter {
  start: number;
  end: number;
  text: string;
  language: string;
}

interface TimelineProps {
  currentTime: number;
  duration: number;
  chapters: Chapter[];
  torrentRanges: { start: number; end: number }[];
  onSeek: (e: React.MouseEvent<HTMLDivElement>) => void;
  onDragStart: (e: React.MouseEvent) => void;
}

const Timeline = ({
  currentTime,
  duration,
  chapters,
  torrentRanges,
  onSeek,
  onDragStart,
}: TimelineProps) => {
  return (
    <div
      className="w-full h-1 hover:h-1.5 transition-all duration-200 cursor-pointer group progress-bar-container relative"
      onClick={onSeek}
    >
      {/* Chapters background */}
      <div className="absolute w-full h-full flex">
        {chapters.length > 0 ? (
          chapters.map((chapter, index) => (
            <div
              className="h-full bg-white/20 relative hover:bg-white/10 transition-colors"
              key={`chapter-${index}`}
              style={{
                width: `${((chapter.end - chapter.start) / duration) * 100}%`,
                marginRight: index !== chapters.length - 1 ? '6px' : '0',
              }}
            />
          ))
        ) : (
          <div className="w-full h-full bg-white/20" />
        )}
      </div>

      {/* Torrent ranges */}
      <div className="absolute w-full h-full z-[2]">
        {torrentRanges.map((range, index) => (
          <div
            key={`progress-${index}`}
            className="absolute h-full bg-white/30 mix-blend-screen"
            style={{
              left: `${range.start * 100}%`,
              width: `${(range.end - range.start) * 100}%`,
            }}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div
        className="absolute h-full bg-[#ff5680] z-[3]"
        style={{
          width: `${(currentTime / duration) * 100}%`,
        }}
      />

      {/* Draggable handle */}
      <div
        className="absolute w-2 h-2 group-hover:-top-1.5 -top-0.5 bg-[#ff5680] rounded-full shadow-lg transform -translate-x-1/2
                   group-hover:w-4 group-hover:h-4 transition-all duration-200 cursor-grab z-30"
        style={{
          left: `${(currentTime / duration) * 100}%`,
        }}
        onMouseDown={onDragStart}
      />

      {/* Invisible wider hit area for better UX */}
      <div
        className="absolute h-8 w-full -top-3 z-20"
        onMouseDown={onDragStart}
      />
    </div>
  );
};

export default Timeline;
