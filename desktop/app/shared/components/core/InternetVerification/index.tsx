import { PropsWithChildren, useEffect, useState } from 'react';

import useInternetConnection from '@hooks/system/useInternetConnection';

const InternetVerification = ({ children }: PropsWithChildren) => {
  const [isMounted, setIsMounted] = useState(false);
  const internetConnection = useInternetConnection();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      internetConnection.startMonitoring();
    }
    return () => {
      internetConnection.stopMonitoring();
    };
  }, [isMounted, internetConnection]);

  return <>{children}</>;
};

export default InternetVerification;
