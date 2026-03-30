/**
 * Infinite Scroll Hook
 * Provides infinite scrolling functionality with automatic loading,
 * error handling, and scroll position memory
 */

import { useEffect, useRef, useState, useCallback } from "react";

export interface UseInfiniteScrollOptions<T> {
  fetchData: (page: number, pageSize: number) => Promise<T[]>;
  pageSize?: number;
  threshold?: number;
  enabled?: boolean;
  onError?: (error: Error) => void;
  initialData?: T[];
}

export interface UseInfiniteScrollReturn<T> {
  data: T[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => void;
  retry: () => void;
  reset: () => void;
  observerRef: (node: HTMLElement | null) => void;
}

export function useInfiniteScroll<T>({
  fetchData,
  pageSize = 20,
  threshold = 0.8,
  enabled = true,
  onError,
  initialData = [],
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollReturn<T> {
  const [data, setData] = useState<T[]>(initialData);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef(false);

  /**
   * Load initial data
   */
  const loadInitialData = useCallback(async () => {
    if (!enabled || loadingRef.current) return;

    loadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const newData = await fetchData(0, pageSize);
      setData(newData);
      setPage(1);
      setHasMore(newData.length === pageSize);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to load data");
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [enabled, fetchData, pageSize, onError]);

  /**
   * Load more data
   */
  const loadMore = useCallback(async () => {
    if (!enabled || loadingRef.current || !hasMore || isLoading) return;

    loadingRef.current = true;
    setIsLoadingMore(true);
    setError(null);

    try {
      const newData = await fetchData(page, pageSize);

      if (newData.length === 0) {
        setHasMore(false);
      } else {
        setData((prev) => [...prev, ...newData]);
        setPage((prev) => prev + 1);
        setHasMore(newData.length === pageSize);
      }
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to load more data");
      setError(error);
      onError?.(error);
    } finally {
      setIsLoadingMore(false);
      loadingRef.current = false;
    }
  }, [enabled, fetchData, page, pageSize, hasMore, isLoading, onError]);

  /**
   * Retry after error
   */
  const retry = useCallback(() => {
    if (data.length === 0) {
      loadInitialData();
    } else {
      loadMore();
    }
  }, [data.length, loadInitialData, loadMore]);

  /**
   * Reset to initial state
   */
  const reset = useCallback(() => {
    setData(initialData);
    setPage(0);
    setError(null);
    setHasMore(true);
    loadInitialData();
  }, [initialData, loadInitialData]);

  /**
   * Intersection Observer callback
   */
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && hasMore && !isLoadingMore && !isLoading) {
        loadMore();
      }
    },
    [hasMore, isLoadingMore, isLoading, loadMore],
  );

  /**
   * Observer ref callback
   */
  const setObserverRef = useCallback(
    (node: HTMLElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      if (node && enabled) {
        observerRef.current = new IntersectionObserver(handleObserver, {
          threshold,
        });
        observerRef.current.observe(node);
      }
    },
    [enabled, handleObserver, threshold],
  );

  /**
   * Load initial data on mount
   */
  useEffect(() => {
    if (enabled && data.length === 0) {
      loadInitialData();
    }
  }, [enabled]); // Only run on mount or when enabled changes

  /**
   * Cleanup observer on unmount
   */
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    data,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    retry,
    reset,
    observerRef: setObserverRef,
  };
}

/**
 * Scroll position memory hook
 * Saves and restores scroll position when navigating away and back
 */
export function useScrollPositionMemory(key: string) {
  const scrollPositions = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const savedPosition = scrollPositions.current.get(key);
    if (savedPosition !== undefined) {
      window.scrollTo(0, savedPosition);
    }

    const handleScroll = () => {
      scrollPositions.current.set(key, window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [key]);

  const clearPosition = useCallback(() => {
    scrollPositions.current.delete(key);
  }, [key]);

  return { clearPosition };
}
