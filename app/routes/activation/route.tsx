import Activation from '@components/core/Activation';
import { useConfig } from '@context/ConfigContext';

export default function ActivationRoute() {
  const { config } = useConfig();
  
  return (
    <div className="dark min-h-screen flex items-center justify-center">
      <Activation isValid={false} />
    </div>
  );
}