import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { ExerciseVideo, VideoFilters } from '../../types/video';
import { searchExerciseVideos } from '../../services/videoService';
import VideoCard from './VideoCard';
import VideoPlayer from './VideoPlayer';
import CategoryFilter from './CategoryFilter';
import { VideoCardSkeleton, ButtonWithLoading } from '../common/LoadingStates';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { ErrorDisplay } from '../common/ErrorDisplay';

interface VideoLibraryProps {
  className?: string;
}

// Generate mock videos as fallback
const generateMockVideos = (): ExerciseVideo[] => {
  return [
    {
      id: 'mock-1',
      youtubeId: 'dQw4w9WgXcQ',
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      title: 'Basic Neck Stretches',
      description:
        'Simple neck stretches to relieve tension and improve mobility.',
      categoryId: 'neck',
      difficulty: 'beginner' as const,
      duration: 5, // 5 minutes
      equipmentRequired: [],
      bodyParts: ['neck'],
      tags: ['stretching', 'mobility'],
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      category: {
        id: 'neck',
        name: 'Neck & Shoulders',
        description: 'Exercises for neck and shoulder pain',
        icon: '🦴',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
    {
      id: 'mock-2',
      youtubeId: 'dQw4w9WgXcQ',
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      title: 'Lower Back Strengthening',
      description:
        'Strengthen your lower back muscles with these safe exercises.',
      categoryId: 'back',
      difficulty: 'intermediate' as const,
      duration: 10, // 10 minutes
      equipmentRequired: ['mat'],
      bodyParts: ['lower back'],
      tags: ['strengthening', 'core'],
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      category: {
        id: 'back',
        name: 'Back & Spine',
        description: 'Exercises for back pain relief',
        icon: '🏃',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
    {
      id: 'mock-3',
      youtubeId: 'dQw4w9WgXcQ',
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      title: 'Knee Rehabilitation Exercises',
      description: 'Gentle exercises to help recover from knee injuries.',
      categoryId: 'knee',
      difficulty: 'beginner' as const,
      duration: 450, // 7.5 minutes
      equipmentRequired: ['chair'],
      bodyParts: ['knee'],
      tags: ['rehabilitation', 'recovery'],
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      category: {
        id: 'knee',
        name: 'Knee & Leg',
        description: 'Exercises for knee and leg issues',
        icon: '🦵',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
  ];
};

const VideoLibrary: React.FC<VideoLibraryProps> = ({ className = '' }) => {
  const [videos, setVideos] = useState<ExerciseVideo[]>([]);
  const [filters, setFilters] = useState<VideoFilters>({});

  // Memoize filters to prevent unnecessary re-renders
  const memoizedFilters = useMemo(() => filters, [JSON.stringify(filters)]);
  const [selectedVideo, setSelectedVideo] = useState<ExerciseVideo | null>(
    null
  );
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalVideos, setTotalVideos] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const VIDEOS_PER_PAGE = 12;
  const { handleApiError } = useErrorHandler();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load videos when filters change - avoid callback dependency
  useEffect(() => {
    const loadVideos = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if we have mock data or real data
        const response = await searchExerciseVideos(
          memoizedFilters,
          1,
          VIDEOS_PER_PAGE
        );

        setVideos(response.videos);
        setTotalVideos(response.total);
        setCurrentPage(1);
        setHasMore(
          response.videos.length === VIDEOS_PER_PAGE &&
            VIDEOS_PER_PAGE < response.total
        );

        // If we got videos, show success message
        if (response.videos.length > 0) {
          console.log(`Loaded ${response.videos.length} videos successfully`);
        }
      } catch (err) {
        console.error('Error loading videos:', err);
        const errorMessage =
          'Unable to load exercise videos. Using sample data instead.';
        setError(errorMessage);
        handleApiError(err, 'Loading exercise videos');

        // Provide fallback mock data
        const mockVideos = generateMockVideos();
        setVideos(mockVideos);
        setTotalVideos(mockVideos.length);
        setCurrentPage(1);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    };

    loadVideos();
  }, [memoizedFilters, handleApiError]);

  // Separate function for loading more videos
  const loadMoreVideos = useCallback(async () => {
    if (loading || !hasMore) return;

    try {
      setLoading(true);
      setError(null);

      const response = await searchExerciseVideos(
        memoizedFilters,
        currentPage + 1,
        VIDEOS_PER_PAGE
      );

      setVideos(prev => [...prev, ...response.videos]);
      setCurrentPage(prev => prev + 1);
      setHasMore(
        response.videos.length === VIDEOS_PER_PAGE &&
          (currentPage + 1) * VIDEOS_PER_PAGE < response.total
      );
    } catch (err) {
      console.error('Error loading more videos:', err);
      const errorMessage = 'Failed to load more videos.';
      setError(errorMessage);
      handleApiError(err, 'Loading more videos');
    } finally {
      setLoading(false);
    }
  }, [memoizedFilters, currentPage, hasMore, loading, handleApiError]);

  // Handle filter changes
  const handleFiltersChange = (newFilters: VideoFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  // Handle video selection
  const handleVideoSelect = (video: ExerciseVideo) => {
    setSelectedVideo(video);
    setIsPlayerOpen(true);
  };

  // Handle player close
  const handlePlayerClose = () => {
    setIsPlayerOpen(false);
    setSelectedVideo(null);
  };

  // Load more videos
  const handleLoadMore = () => {
    loadMoreVideos();
  };

  // Clear filters
  const handleClearFilters = () => {
    setFilters({});
  };

  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof VideoFilters];
    return (
      value !== undefined &&
      value !== '' &&
      (!Array.isArray(value) || value.length > 0)
    );
  });

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
          Exercise Library
        </h1>
        <p className="text-base sm:text-lg text-gray-600 max-w-3xl">
          Discover curated physiotherapy exercises organized by condition and
          difficulty level
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <CategoryFilter
            filters={filters}
            onFiltersChange={handleFiltersChange}
            className="lg:sticky lg:top-4"
          />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 order-1 lg:order-2">
          {/* Results Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <p
                className="text-sm text-gray-600"
                role="status"
                aria-live="polite"
              >
                {loading
                  ? 'Loading...'
                  : `${totalVideos} video${totalVideos !== 1 ? 's' : ''} found`}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded px-2 py-1 self-start"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {/* Error State */}
          <ErrorDisplay
            error={error}
            onRetry={() => window.location.reload()}
            title="Unable to load exercise videos"
            className="mb-6"
          />

          {/* Loading State */}
          {loading && videos.length === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <VideoCardSkeleton key={index} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && videos.length === 0 && !error && (
            <div className="text-center py-12">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No videos found
              </h3>
              <p className="text-gray-600 mb-4">
                {hasActiveFilters
                  ? 'Try adjusting your filters to find more videos.'
                  : 'No exercise videos are currently available.'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}

          {/* Videos Grid */}
          {videos.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {videos.map(video => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    onVideoSelect={handleVideoSelect}
                  />
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="text-center">
                  <ButtonWithLoading
                    onClick={handleLoadMore}
                    isLoading={loading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px]"
                  >
                    Load More Videos
                  </ButtonWithLoading>
                </div>
              )}

              {/* Results Summary */}
              <div className="text-center text-sm text-gray-500 mt-4">
                Showing {videos.length} of {totalVideos} videos
              </div>
            </>
          )}
        </div>
      </div>

      {/* Video Player Modal */}
      <VideoPlayer
        video={selectedVideo}
        isOpen={isPlayerOpen}
        onClose={handlePlayerClose}
      />
    </div>
  );
};

export default VideoLibrary;
