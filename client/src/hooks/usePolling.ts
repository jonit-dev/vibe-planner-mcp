import { useEffect, useRef } from 'react';

// Updated FetchFunction type to accept an optional boolean indicating if it's the initial call
type FetchFunction = (isInitialCall?: boolean) => void;

/**
 * Custom hook to periodically call a fetch function.
 *
 * @param fetcher The function to call to fetch data. It will receive `true` for the initial call, `false` for polling calls.
 * @param intervalMilliseconds The interval in milliseconds to call the fetcher. Defaults to 3000ms.
 * @param enabled Whether the polling is currently active. Defaults to true.
 */
const usePolling = (
  fetcher: FetchFunction,
  intervalMilliseconds: number = 3000,
  enabled: boolean = true
) => {
  // Using useCallback for fetcherRef.current to ensure stable reference for the effect, if fetcher itself is stable.
  // However, fetcher can change, so we still need to update savedFetcher in an effect.
  const savedFetcher = useRef<FetchFunction>();

  useEffect(() => {
    savedFetcher.current = fetcher;
  }, [fetcher]);

  useEffect(() => {
    if (!enabled || !savedFetcher.current) {
      return;
    }

    // Call the fetcher immediately with isInitialCall = true
    savedFetcher.current(true);

    // Set up the interval.
    const intervalId = setInterval(() => {
      if (savedFetcher.current) {
        // Subsequent calls are polling calls
        savedFetcher.current(false);
      }
    }, intervalMilliseconds);

    // Clean up the interval on unmount or when dependencies change.
    return () => {
      clearInterval(intervalId);
    };
    // We depend on intervalMilliseconds and enabled.
    // Fetcher is handled by ref and an effect to update the ref, so it's not directly in deps here.
  }, [intervalMilliseconds, enabled]);
};

export default usePolling;
