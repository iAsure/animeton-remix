export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
) => {
  let timeoutId: NodeJS.Timeout;

  const debouncedFn = (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };

  debouncedFn.cancel = () => {
    clearTimeout(timeoutId);
  };

  return debouncedFn as typeof debouncedFn & { cancel: () => void };
};

export const throttle = <T extends (...args: any[]) => void>(
  func: T,
  limit: number
) => {
  let inThrottle: boolean;
  let lastFunc: ReturnType<typeof setTimeout>;
  let lastRan: number;

  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(null, args);
      lastRan = Date.now();
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          func.apply(null, args);
          lastRan = Date.now();
        }
      }, limit);
    }
  };
};
