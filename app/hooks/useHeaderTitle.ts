import { useState, useEffect } from 'react';

const defaultHeaderTitle = 'Beta cerrada';

export const useHeaderTitle = () => {
  const [headerTitle, setHeaderTitle] = useState(defaultHeaderTitle);

  useEffect(() => {
    const handleHeaderTitle = (newTitle) => {
      setHeaderTitle(newTitle);
    };

    // eventBus.on('headerTitle', handleHeaderTitle);
  }, []);

  return { headerTitle };
};
