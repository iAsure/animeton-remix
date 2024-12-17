import { useState, useCallback, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from '@remix-run/react';

import useSearchStore from '@stores/search';

const PLAYER_PATH = '/player';
const POPULAR_ANIME_PATH = '/popular-anime';
const HOME_PATH = '/';
const defaultHeaderTitle = 'Beta cerrada';
const isPlayerRoute = (path) => path?.includes(PLAYER_PATH);
const isPopularAnimeRoute = (path) => path?.includes(POPULAR_ANIME_PATH);

const useHeaderNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const historyRef = useRef<{
    past: string[];
    current: string | null;
    future: string[];
  }>({ past: [], current: null, future: [] });

  const { setSearchTerm } = useSearchStore();

  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [canGoHome, setCanGoHome] = useState(false);
  const [isHome, setIsHome] = useState(false);

  // Navigation state management
  useEffect(() => {
    const currentPath = location.pathname;
    const isCurrentPlayer = isPlayerRoute(currentPath);
    const wasPreviousPlayer = isPlayerRoute(historyRef.current.current);
    const isCurrentPopularAnime = isPopularAnimeRoute(currentPath);
    const wasPreviousPopularAnime = isPopularAnimeRoute(
      historyRef.current.current
    );

    // Send special event when leaving player route
    if (wasPreviousPlayer && !isCurrentPlayer) {
      // posthog?.capture('exit_player', {
      //     from: '/player',
      //     to: currentPath
      // });
    }

    // Send special event when leaving popular-anime route
    if (wasPreviousPopularAnime && !isCurrentPopularAnime) {
      setSearchTerm(null);
    }

    // Only update history if:
    // 1. It's a new route different from the current one
    // 2. We're not navigating between player routes
    if (
      historyRef.current.current !== currentPath &&
      !(isCurrentPlayer && wasPreviousPlayer)
    ) {
      if (historyRef.current.current) {
        historyRef.current.past.push(historyRef.current.current);
      }
      historyRef.current.current = currentPath;

      // Clear the future only if it's not a player route
      if (!isCurrentPlayer) {
        historyRef.current.future = [];
      }

      // Track route change
      // posthog?.capture('route_changed', {
      //     from: historyRef.current.past[historyRef.current.past.length - 1] || null,
      //     to: currentPath,
      //     method: 'navigation'
      // });
    }
    // Update navigation states considering player routes
    const lastNonPlayerPast = [...historyRef.current.past]
      .reverse()
      .find((path) => !isPlayerRoute(path));
    const firstNonPlayerFuture = historyRef.current.future.find(
      (path) => !isPlayerRoute(path)
    );

    setCanGoBack(!!lastNonPlayerPast);
    setCanGoForward(!!firstNonPlayerFuture);
    setIsHome(currentPath === '/');

    // Update header title when not in player route
    if (!isCurrentPlayer) {
      // eventBus.emit('headerTitle', defaultHeaderTitle);
    }

    // Debug logging
    console.log('History state:', {
      past: historyRef.current.past,
      current: historyRef.current.current,
      future: historyRef.current.future,
    });
  }, [location]);

  // Update canGoHome based on path only
  useEffect(() => {
    const currentPath = location.pathname;
    setCanGoHome(currentPath !== HOME_PATH);
  }, [location.pathname]);

  useEffect(() => {
    const updateNavigationState = () => {
      setCanGoBack(historyRef.current.past.length > 0);
      setCanGoForward(
        historyRef.current.future.length > 0 &&
          !isPlayerRoute(historyRef.current.future[0])
      );
    };

    updateNavigationState();
    return () => {
      // eventBus.off('historyUpdated', updateNavigationState);
    };
  }, []);

  // Navigation handlers
  const handleBack = useCallback(
    (e) => {
      e.preventDefault();
      const lastNonPlayerPast = [...historyRef.current.past]
        .reverse()
        .find((path) => !isPlayerRoute(path));
      if (lastNonPlayerPast) {
        // Remove all entries until we find the last non-player route
        while (
          historyRef.current.past.length > 0 &&
          historyRef.current.past[historyRef.current.past.length - 1] !==
            lastNonPlayerPast
        ) {
          historyRef.current.past.pop();
        }
        const prevPage = historyRef.current.past.pop();

        historyRef.current.future.unshift(historyRef.current.current);
        historyRef.current.current = prevPage;
        navigate(prevPage, { viewTransition: true });

        // Track back navigation
        // posthog?.capture('route_changed', {
        //     from: historyRef.current.current,
        //     to: prevPage,
        //     method: 'back_button'
        // });

        // eventBus.emit('historyUpdated');
      }
    },
    [historyRef, navigate]
  );

  const handleForward = useCallback(
    (e) => {
      e.preventDefault();
      const firstNonPlayerFuture = historyRef.current.future.find(
        (path) => !isPlayerRoute(path)
      );
      if (firstNonPlayerFuture) {
        // Remove all entries until we find the first non-player route
        while (
          historyRef.current.future.length > 0 &&
          historyRef.current.future[0] !== firstNonPlayerFuture
        ) {
          historyRef.current.future.shift();
        }
        const nextPage = historyRef.current.future.shift();

        historyRef.current.past.push(historyRef.current.current);
        historyRef.current.current = nextPage;
        navigate(nextPage, { viewTransition: true });

        // Track forward navigation
        // posthog?.capture('route_changed', {
        //     from: historyRef.current.past[historyRef.current.past.length - 1],
        //     to: nextPage,
        //     method: 'forward_button'
        // });

        // eventBus.emit('historyUpdated');
      }
    },
    [historyRef, navigate]
  );

  const handleHome = useCallback(
    (e) => {
      e?.preventDefault();
      if (!canGoHome) return;

      navigate(HOME_PATH, { viewTransition: true });
      setSearchTerm('');
    },
    [navigate, canGoHome]
  );

  return {
    canGoBack,
    canGoForward,
    canGoHome,
    isHome,
    handleBack,
    handleForward,
    handleHome,
    currentPath: location.pathname,
  };
};

export { useHeaderNavigation };
