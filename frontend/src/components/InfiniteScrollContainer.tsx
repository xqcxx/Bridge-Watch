/**
 * Infinite Scroll Container Component
 * Reusable container for infinite scrolling lists with loading states,
 * error handling, and back to top functionality
 */

import React from "react";
import {
  useInfiniteScroll,
  UseInfiniteScrollOptions,
} from "../hooks/useInfiniteScroll";
import LoadingSpinner from "./Skeleton/LoadingSpinner";

interface InfiniteScrollContainerProps<T> extends UseInfiniteScrollOptions<T> {
  renderItem: (item: T, index: number) => React.ReactNode;
  renderEmpty?: () => React.ReactNode;
  renderError?: (error: Error, retry: () => void) => React.ReactNode;
  className?: string;
  showBackToTop?: boolean;
  showItemCount?: boolean;
  itemName?: string;
}

export function InfiniteScrollContainer<T>({
  renderItem,
  renderEmpty,
  renderError,
  className = "",
  showBackToTop = true,
  showItemCount = true,
  itemName = "items",
  ...scrollOptions
}: InfiniteScrollContainerProps<T>) {
  const { data, isLoading, isLoadingMore, error, hasMore, retry, observerRef } =
    useInfiniteScroll<T>(scrollOptions);

  const [showBackButton, setShowBackButton] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setShowBackButton(window.scrollY > 500);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Initial loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner message="Loading..." />
      </div>
    );
  }

  // Error state
  if (error && data.length === 0) {
    if (renderError) {
      return <>{renderError(error, retry)}</>;
    }

    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="text-red-600 mb-4">
          <svg
            className="w-16 h-16"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Failed to load data
        </h3>
        <p className="text-gray-600 mb-4 text-center max-w-md">
          {error.message}
        </p>
        <button
          onClick={retry}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    if (renderEmpty) {
      return <>{renderEmpty()}</>;
    }

    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="text-gray-400 mb-4">
          <svg
            className="w-16 h-16"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No {itemName} found
        </h3>
        <p className="text-gray-600 text-center max-w-md">
          There are no {itemName} to display at this time.
        </p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Item count */}
      {showItemCount && (
        <div className="mb-4 text-sm text-gray-600">
          Showing {data.length} {itemName}
          {hasMore && " (loading more as you scroll)"}
        </div>
      )}

      {/* Items list */}
      <div className="space-y-4">
        {data.map((item, index) => (
          <React.Fragment key={index}>{renderItem(item, index)}</React.Fragment>
        ))}
      </div>

      {/* Loading more indicator */}
      {isLoadingMore && (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner message="Loading..." className="p-2" />
          <span className="ml-3 text-gray-600">Loading more {itemName}...</span>
        </div>
      )}

      {/* Error loading more */}
      {error && data.length > 0 && (
        <div className="flex flex-col items-center justify-center py-8">
          <p className="text-red-600 mb-3">Failed to load more {itemName}</p>
          <button
            onClick={retry}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Retry
          </button>
        </div>
      )}

      {/* End of list indicator */}
      {!hasMore && !isLoadingMore && data.length > 0 && (
        <div className="text-center py-8 text-gray-500 text-sm">
          You've reached the end of the list
        </div>
      )}

      {/* Intersection observer target */}
      {hasMore && !isLoadingMore && <div ref={observerRef} className="h-10" />}

      {/* Back to top button */}
      {showBackToTop && showBackButton && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 z-50"
          aria-label="Back to top"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
