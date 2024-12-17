import SubtitleItem from './SubtitleItem';

const SubtitleSelector = ({ state, currentSubtitles }) => {
    const subtitlesData = state.playing?.subtitles;
    if (!currentSubtitles.tracks.length || !subtitlesData.showMenu) return;

    return (
        <ul
            key="subtitle-options"
            className="absolute bottom-16 right-8 bg-zinc-900 rounded-lg shadow-lg backdrop-blur-sm border border-zinc-800 min-w-[200px] py-2"
            style={{ zIndex: 9999 }}
        >
            {currentSubtitles.tracks.map((track, ix) => (
                <SubtitleItem
                    key={ix}
                    isSelected={subtitlesData.selectedIndex === ix}
                    label={track.label}
                />
            ))}

            <div className="my-2 border-t border-zinc-800" />

            <SubtitleItem
                isSelected={subtitlesData.selectedIndex === -1}
                label="Sin subtítulos"
            />
        </ul>
    );
}

module.exports = SubtitleSelector;