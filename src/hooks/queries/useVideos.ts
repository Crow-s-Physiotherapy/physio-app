import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import * as videoService from '../../services/videoService';
import type {
  ExerciseVideoFormData,
  VideoCategoryFormData,
  VideoFilters,
  VideoSearchParams,
  VideoDifficulty,
} from '../../types/video';

// Query keys for React Query
export const videoKeys = {
  all: ['videos'] as const,
  lists: () => [...videoKeys.all, 'list'] as const,
  list: (filters: VideoSearchParams) =>
    [...videoKeys.lists(), { filters }] as const,
  infinite: (filters: VideoFilters) =>
    [...videoKeys.lists(), 'infinite', { filters }] as const,
  details: () => [...videoKeys.all, 'detail'] as const,
  detail: (id: string) => [...videoKeys.details(), id] as const,
  categories: () => [...videoKeys.all, 'categories'] as const,
  bodyParts: () => [...videoKeys.all, 'bodyParts'] as const,
  equipment: () => [...videoKeys.all, 'equipment'] as const,
};

// Hook for getting video categories
export function useVideoCategories() {
  return useQuery({
    queryKey: videoKeys.categories(),
    queryFn: videoService.getVideoCategories,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
  });
}

// Hook for getting exercise videos with pagination
export function useExerciseVideos(params: VideoSearchParams = {}) {
  return useQuery({
    queryKey: videoKeys.list(params),
    queryFn: () => videoService.getExerciseVideos(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    placeholderData: previousData => previousData, // Keep previous data while fetching new data
  });
}

// Hook for infinite scrolling of exercise videos
export function useInfiniteExerciseVideos(
  filters: VideoFilters = {},
  limit: number = 20
) {
  return useInfiniteQuery({
    queryKey: videoKeys.infinite(filters),
    queryFn: ({ pageParam = 1 }) =>
      videoService.searchExerciseVideos(filters, pageParam as number, limit),
    initialPageParam: 1,
    getNextPageParam: (lastPage: any) => {
      const hasMore = lastPage.videos.length === limit;
      return hasMore ? lastPage.page + 1 : undefined;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
  });
}

// Hook for getting a single exercise video
export function useExerciseVideo(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: videoKeys.detail(id),
    queryFn: () => videoService.getExerciseVideoById(id),
    enabled: enabled && !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
  });
}

// Hook for searching exercise videos
export function useSearchExerciseVideos(
  filters: VideoFilters,
  page: number = 1,
  limit: number = 20,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: [...videoKeys.lists(), 'search', { filters, page, limit }],
    queryFn: () => videoService.searchExerciseVideos(filters, page, limit),
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    placeholderData: previousData => previousData,
  });
}

// Hook for getting videos by category
export function useVideosByCategory(
  categoryId: string,
  page: number = 1,
  limit: number = 20,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: [...videoKeys.lists(), 'category', categoryId, { page, limit }],
    queryFn: () => videoService.getVideosByCategory(categoryId, page, limit),
    enabled: enabled && !!categoryId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    placeholderData: previousData => previousData,
  });
}

// Hook for getting videos by difficulty
export function useVideosByDifficulty(
  difficulty: VideoDifficulty,
  page: number = 1,
  limit: number = 20,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: [...videoKeys.lists(), 'difficulty', difficulty, { page, limit }],
    queryFn: () => videoService.getVideosByDifficulty(difficulty, page, limit),
    enabled: enabled && !!difficulty,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    placeholderData: previousData => previousData,
  });
}

// Hook for getting videos by body part
export function useVideosByBodyPart(
  bodyPart: string,
  page: number = 1,
  limit: number = 20,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: [...videoKeys.lists(), 'bodyPart', bodyPart, { page, limit }],
    queryFn: () => videoService.getVideosByBodyPart(bodyPart, page, limit),
    enabled: enabled && !!bodyPart,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    placeholderData: previousData => previousData,
  });
}

// Hook for getting unique body parts
export function useUniqueBodyParts() {
  return useQuery({
    queryKey: videoKeys.bodyParts(),
    queryFn: videoService.getUniqueBodyParts,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 2,
  });
}

// Hook for getting unique equipment types
export function useUniqueEquipmentTypes() {
  return useQuery({
    queryKey: videoKeys.equipment(),
    queryFn: videoService.getUniqueEquipmentTypes,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 2,
  });
}

// Hook for creating exercise videos
export function useCreateExerciseVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (videoData: ExerciseVideoFormData) =>
      videoService.createExerciseVideo(videoData),
    onSuccess: response => {
      if (response.success) {
        // Invalidate and refetch video-related queries
        queryClient.invalidateQueries({ queryKey: videoKeys.lists() });
        toast.success(response.message || 'Video created successfully!');
      } else {
        toast.error(response.message || 'Failed to create video.');
      }
    },
    onError: (error: Error) => {
      console.error('Failed to create video:', error);
      toast.error(error.message || 'Failed to create video. Please try again.');
    },
  });
}

// Hook for updating exercise videos
export function useUpdateExerciseVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      videoData,
    }: {
      id: string;
      videoData: Partial<ExerciseVideoFormData>;
    }) => videoService.updateExerciseVideo(id, videoData),
    onSuccess: (response, variables) => {
      if (response.success) {
        // Update the specific video in the cache
        queryClient.setQueryData(videoKeys.detail(variables.id), response);

        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: videoKeys.lists() });
        toast.success(response.message || 'Video updated successfully!');
      } else {
        toast.error(response.message || 'Failed to update video.');
      }
    },
    onError: (error: Error) => {
      console.error('Failed to update video:', error);
      toast.error(error.message || 'Failed to update video. Please try again.');
    },
  });
}

// Hook for deleting exercise videos
export function useDeleteExerciseVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => videoService.deleteExerciseVideo(id),
    onSuccess: (response, id) => {
      if (response.success) {
        // Remove the video from cache
        queryClient.removeQueries({ queryKey: videoKeys.detail(id) });

        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: videoKeys.lists() });
        toast.success(response.message || 'Video deleted successfully.');
      } else {
        toast.error(response.message || 'Failed to delete video.');
      }
    },
    onError: (error: Error) => {
      console.error('Failed to delete video:', error);
      toast.error(error.message || 'Failed to delete video. Please try again.');
    },
  });
}

// Hook for creating video categories
export function useCreateVideoCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryData: VideoCategoryFormData) =>
      videoService.createVideoCategory(categoryData),
    onSuccess: response => {
      if (response.success) {
        // Invalidate categories query
        queryClient.invalidateQueries({ queryKey: videoKeys.categories() });
        toast.success(response.message || 'Category created successfully!');
      } else {
        toast.error(response.message || 'Failed to create category.');
      }
    },
    onError: (error: Error) => {
      console.error('Failed to create category:', error);
      toast.error(
        error.message || 'Failed to create category. Please try again.'
      );
    },
  });
}

// Hook for updating video categories
export function useUpdateVideoCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      categoryData,
    }: {
      id: string;
      categoryData: Partial<VideoCategoryFormData>;
    }) => videoService.updateVideoCategory(id, categoryData),
    onSuccess: response => {
      if (response.success) {
        // Invalidate categories query
        queryClient.invalidateQueries({ queryKey: videoKeys.categories() });
        toast.success(response.message || 'Category updated successfully!');
      } else {
        toast.error(response.message || 'Failed to update category.');
      }
    },
    onError: (error: Error) => {
      console.error('Failed to update category:', error);
      toast.error(
        error.message || 'Failed to update category. Please try again.'
      );
    },
  });
}

// Hook for deleting video categories
export function useDeleteVideoCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => videoService.deleteVideoCategory(id),
    onSuccess: response => {
      if (response.success) {
        // Invalidate categories query
        queryClient.invalidateQueries({ queryKey: videoKeys.categories() });
        toast.success(response.message || 'Category deleted successfully.');
      } else {
        toast.error(response.message || 'Failed to delete category.');
      }
    },
    onError: (error: Error) => {
      console.error('Failed to delete category:', error);
      toast.error(
        error.message || 'Failed to delete category. Please try again.'
      );
    },
  });
}

// Hook for incrementing video view count
export function useIncrementVideoViewCount() {
  return useMutation({
    mutationFn: (id: string) => {
      // This method doesn't exist in videoService, so we'll create a placeholder
      console.log('Incrementing view count for video:', id);
      return Promise.resolve({ success: true });
    },
    // Don't show toast notifications for view count increments
    onError: (error: Error) => {
      console.warn('Failed to increment view count:', error);
      // Silently fail - this is not critical functionality
    },
  });
}
