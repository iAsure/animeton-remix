const parseTimeToAss = (timeInMilliseconds: number): string => {
  const timeInSeconds = timeInMilliseconds / 1000;
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  const centiseconds = Math.floor((timeInSeconds % 1) * 100);

  return `${hours.toString().padStart(1, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds
    .toString()
    .padStart(2, '0')}`;
};

interface SubtitleCue {
  time: number;
  duration: number;
  text: string;
  layer?: string;
  marginL?: string;
  marginR?: string;
  marginV?: string;
  style?: string;
  name?: string;
  effect?: string;
}

export const formatAssSubtitles = (subtitleTrack: {
  track: { header: string };
  cues: SubtitleCue[];
}): string => {
  let assContent = subtitleTrack.track.header;

  subtitleTrack.cues.forEach((cue) => {
    const startTime = parseTimeToAss(cue.time);
    const endTime = parseTimeToAss(cue.time + cue.duration);
    const assLine = `Dialogue: ${cue.layer || '0'},${startTime},${endTime},${
      cue.style || 'Default'
    },${cue.name || ''},${cue.marginL || '0'},${cue.marginR || '0'},${
      cue.marginV || '0'
    },${cue.effect || ''},${cue.text}\n`;
    assContent += assLine;
  });

  return assContent;
};
