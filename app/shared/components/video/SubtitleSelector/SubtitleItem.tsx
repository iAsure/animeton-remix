import { Icon } from '@iconify/react';

interface SubtitleItemProps {
    isSelected: boolean;
    label: string;
    onClick?: () => void;
}

const SubtitleItem = ({ isSelected, label, onClick }: SubtitleItemProps) => (
    <li
        onClick={onClick || undefined}
        className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800 cursor-pointer transition-colors"
        style={{
            zIndex: 9999
        }}
    >
        <Icon
            icon={isSelected ? 'mdi:radiobox-marked' : 'mdi:radiobox-blank'}
            className={`text-lg ${isSelected ? 'text-zinc-200' : 'text-zinc-400'}`}
        />
        <span>{label}</span>
    </li>
);

export default SubtitleItem;