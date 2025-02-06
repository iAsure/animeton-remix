import { Component, ReactNode, useEffect } from 'react';
import ErrorDisplay from '../ErrorDisplay';
import { useAmplitude } from '@shared/lib/amplitude';
import { Button } from '@nextui-org/react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

class ErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorBoundaryFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
        />
      );
    }

    return this.props.children;
  }
}

function ErrorBoundaryFallback({
  error,
  errorInfo,
}: {
  error?: Error;
  errorInfo?: React.ErrorInfo;
}) {
  const amplitude = useAmplitude();

  useEffect(() => {
    if (error && errorInfo && amplitude) {
      amplitude.track('React Error', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        type: 'react.error',
      });
    }
  }, [error, errorInfo, amplitude]);

  return (
    <div className="h-full flex flex-col items-center justify-center bg-zinc-950 p-8">
      <ErrorDisplay
        icon="icon-park-outline:error-computer"
        title="Ha ocurrido un error"
        description="Lamentamos el inconveniente, por favor intenta nuevamente más tarde."
        showDetails={true}
        error={error}
        iconSize={150}
        containerClassName="h-full"
        actions={
          <div className="flex gap-4">
            <Button 
              className="relative text-center flex justify-center items-center rounded-lg px-8 py-3 bg-white text-black font-bold hover:bg-opacity-90 transition-all duration-300"
              onClick={() => window.location.reload()}
            >
              Reintentar
            </Button>
            <Button 
              className="relative text-center flex justify-center items-center rounded-lg px-8 py-3 bg-red-500 text-white font-bold hover:bg-opacity-90 transition-all duration-300"
              onClick={() => window.api.shell.quitApp()}
            >
              Salir
            </Button>
          </div>
        }
      />
    </div>
  );
}

export default ErrorBoundaryClass;
