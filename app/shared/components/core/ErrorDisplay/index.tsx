import { Icon } from '@iconify/react';

interface ErrorDisplayProps {
  icon?: string;
  title?: string;
  description?: string;
  iconClassName?: string;
  iconSize?: number;
}

export default function ErrorDisplay({
  icon = "gravity-ui:circle-xmark",
  title = "Ha ocurrido un error",
  description = "Intenta de nuevo más tarde.",
  iconClassName = "text-zinc-500",
  iconSize = 128
}: ErrorDisplayProps) {
  return (
    <div className="flex flex-col justify-center items-center w-full min-h-[400px]">
      <Icon
        icon={icon}
        width={iconSize}
        height={iconSize}
        className={iconClassName}
      />
      <p className="text-2xl font-bold text-zinc-500">
        {title}
      </p>
      <p className="text-lg text-zinc-500">
        {description}
      </p>
    </div>
  );
}