import { Icon } from '@iconify/react';

interface ErrorDisplayProps {
  icon?: string;
  title?: string;
  description?: string;
  iconClassName?: string;
  iconSize?: number;
  showDetails?: boolean;
  error?: Error;
  actions?: React.ReactNode;
  containerClassName?: string;
}

export default function ErrorDisplay({
  icon = "gravity-ui:circle-xmark",
  title = "Ha ocurrido un error",
  description = "Intenta de nuevo más tarde.",
  iconClassName = "text-red-500/80",
  iconSize = 96,
  showDetails,
  error,
  actions,
  containerClassName = "min-h-[400px]"
}: ErrorDisplayProps) {
  return (
    <div className={`flex flex-col justify-center items-center w-full ${containerClassName}`}>
      <div className="flex flex-col items-center max-w-2xl text-center px-4">
        <Icon
          icon={icon}
          width={iconSize}
          height={iconSize}
          className={`${iconClassName} mb-6 animate-in fade-in duration-700`}
        />
        <h1 className="text-3xl font-bold text-white mb-3 animate-in slide-in-from-bottom duration-300">
          {title}
        </h1>
        <p className="text-lg text-zinc-400 animate-in slide-in-from-bottom duration-500">
          {description}
        </p>
        
        {actions && (
          <div className="mt-8 flex gap-4 animate-in slide-in-from-bottom duration-700">
            {actions}
          </div>
        )}

        {showDetails && error && (
          <div className="mt-12 w-full text-left">
            <details className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
              <summary className="text-sm text-zinc-500 cursor-pointer hover:text-zinc-300 transition-colors">
                Detalles técnicos
              </summary>
              <div className="mt-4 space-y-4">
                <div>
                  <h3 className="text-red-500/80 text-xs font-medium mb-1">Error Message:</h3>
                  <p className="text-zinc-300 text-sm font-mono">{error.message}</p>
                </div>
                {error.stack && (
                  <div>
                    <h3 className="text-red-500/80 text-xs font-medium mb-1">Stack Trace:</h3>
                    <pre className="text-zinc-300 text-sm font-mono whitespace-pre-wrap overflow-auto max-h-[200px]">
                      {error.stack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}