import { useCallback, useState } from 'react';

interface UseApiOptions<T> {
  initialData?: T | null;
}

interface UseApiResult<T, P extends unknown[]> {
  data: T | null;
  error: Error | null;
  loading: boolean;
  request: (...args: P) => Promise<T | undefined>;
}

export function useApi<T, P extends unknown[] = []>(
  apiFunc: (...args: P) => Promise<T>,
  options?: UseApiOptions<T>
): UseApiResult<T, P> {
  const [data, setData] = useState<T | null>(options?.initialData || null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const request = useCallback(
    async (...args: P): Promise<T | undefined> => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiFunc(...args);
        setData(result);
        setLoading(false);
        return result;
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err);
        } else {
          setError(new Error('An unknown error occurred'));
        }
        setLoading(false);
        // Optional: re-throw the error if you want calling components to also handle it
        // throw err;
        return undefined;
      }
    },
    [apiFunc]
  );

  return { data, error, loading, request };
}

// Example Usage (can be in a component):
/*
import { useEffect } from 'react';
import { apiClient } from '../lib/apiClient';
import { PrdSummary } from '../types';

function MyComponent() {
  const { 
    data: planSummaries, 
    error: summariesError, 
    loading: summariesLoading, 
    request: fetchSummaries 
  } = useApi<PrdSummary[]>(apiClient.getPlanSummaries);

  useEffect(() => {
    fetchSummaries();
  }, [fetchSummaries]);

  if (summariesLoading) return <p>Loading summaries...</p>;
  if (summariesError) return <p>Error loading summaries: {summariesError.message}</p>;

  return (
    <div>
      <h1>Plan Summaries</h1>
      {planSummaries && (
        <ul>
          {planSummaries.map(summary => (
            <li key={summary.id}>{summary.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
*/
