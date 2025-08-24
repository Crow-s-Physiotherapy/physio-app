import { supabase } from '../lib/supabase';
import { AppError } from '../utils/errorHandling';
import { isUsingDemoConfig } from '../lib/config';
import type {
  VideoCategory,
  ExerciseVideoFormData,
  VideoCategoryFormData,
  VideoFilters,
  VideoSearchParams,
  ExerciseVideosListResponse,
  VideoCategoriesResponse,
  ExerciseVideoResponse,
  VideoDifficulty,
} from '../types/video';

// =====================================================
// YOUTUBE URL UTILITIES
// =====================================================

/**
 * Extracts YouTube video ID from various YouTube URL formats
 * Supports: youtube.com/watch?v=, youtu.be/, youtube.com/embed/
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;

  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]+)/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]+)/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/,
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Validates if a URL is a valid YouTube URL
 */
export function isValidYouTubeUrl(url: string): boolean {
  return extractYouTubeId(url) !== null;
}

/**
 * Generates YouTube thumbnail URL from video ID
 */
export function getYouTubeThumbnailUrl(
  videoId: string,
  quality: 'default' | 'medium' | 'high' | 'maxres' = 'medium'
): string {
  const qualityMap = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    maxres: 'maxresdefault',
  };
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}

/**
 * Generates YouTube embed URL from video ID
 */
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`;
}

// =====================================================
// VIDEO CATEGORY MANAGEMENT
// =====================================================

/**
 * Fetches all active video categories
 */
export async function getVideoCategories(): Promise<VideoCategoriesResponse> {
  // If using demo config, return mock categories
  if (isUsingDemoConfig.supabase) {
    console.warn('Using demo configuration - returning mock category data');
    return {
      categories: [
        {
          id: 'neck',
          name: 'Neck & Shoulders',
          description: 'Exercises for neck and shoulder pain',
          icon: '🦴',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'back',
          name: 'Back & Spine',
          description: 'Exercises for back pain relief',
          icon: '🏃',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'knee',
          name: 'Knee & Leg',
          description: 'Exercises for knee and leg issues',
          icon: '🦵',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'shoulder',
          name: 'Shoulder & Arm',
          description: 'Exercises for shoulder and arm issues',
          icon: '💪',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'core',
          name: 'Core & Abs',
          description: 'Core strengthening exercises',
          icon: '🎯',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'hip',
          name: 'Hip & Pelvis',
          description: 'Hip and pelvis exercises',
          icon: '🦴',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      success: true,
    };
  }

  try {
    const { data, error } = await supabase
      .from('video_categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching video categories:', error);
      return { categories: [], success: false };
    }

    return {
      categories: data || [],
      success: true,
    };
  } catch (error) {
    console.error('Error in getVideoCategories:', error);
    return { categories: [], success: false };
  }
}

/**
 * Creates a new video category
 */
export async function createVideoCategory(
  categoryData: VideoCategoryFormData
): Promise<{
  category: VideoCategory | null;
  success: boolean;
  message?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('video_categories')
      .insert([
        {
          name: categoryData.name,
          description: categoryData.description,
          icon: categoryData.icon,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating video category:', error);
      return {
        category: null,
        success: false,
        message: error.message,
      };
    }

    return {
      category: data,
      success: true,
      message: 'Category created successfully',
    };
  } catch (error) {
    console.error('Error in createVideoCategory:', error);
    return {
      category: null,
      success: false,
      message: 'Failed to create category',
    };
  }
}

/**
 * Updates an existing video category
 */
export async function updateVideoCategory(
  id: string,
  categoryData: Partial<VideoCategoryFormData>
): Promise<{
  category: VideoCategory | null;
  success: boolean;
  message?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('video_categories')
      .update({
        ...categoryData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating video category:', error);
      return {
        category: null,
        success: false,
        message: error.message,
      };
    }

    return {
      category: data,
      success: true,
      message: 'Category updated successfully',
    };
  } catch (error) {
    console.error('Error in updateVideoCategory:', error);
    return {
      category: null,
      success: false,
      message: 'Failed to update category',
    };
  }
}

/**
 * Deletes a video category (hard delete)
 */
export async function deleteVideoCategory(
  id: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const { error } = await supabase
      .from('video_categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting video category:', error);
      return {
        success: false,
        message: error.message,
      };
    }

    return {
      success: true,
      message: 'Category deleted successfully',
    };
  } catch (error) {
    console.error('Error in deleteVideoCategory:', error);
    return {
      success: false,
      message: 'Failed to delete category',
    };
  }
}

// =====================================================
// EXERCISE VIDEO MANAGEMENT
// =====================================================

/**
 * Fetches exercise videos with optional filtering and pagination
 */
export async function getExerciseVideos(
  params: VideoSearchParams = {}
): Promise<ExerciseVideosListResponse> {
  try {
    const {
      query,
      category,
      difficulty,
      bodyPart,
      equipment,
      page = 1,
      limit = 20,
    } = params;

    let queryBuilder = supabase.from('exercise_videos').select(
      `
        *,
        category:video_categories(*)
      `
    );

    // Apply filters
    if (category) {
      queryBuilder = queryBuilder.eq('category_id', category);
    }

    if (difficulty) {
      queryBuilder = queryBuilder.eq('difficulty_level', difficulty);
    }

    if (bodyPart) {
      queryBuilder = queryBuilder.contains('body_parts', [bodyPart]);
    }

    if (equipment) {
      queryBuilder = queryBuilder.contains('equipment_required', [equipment]);
    }

    if (query) {
      queryBuilder = queryBuilder.or(
        `title.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`
      );
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const result = await queryBuilder.range(from, to).order('created_at', { ascending: false });
    const { data, error, count } = result;

    if (error) {
      console.error('Error fetching exercise videos:', error);
      throw new AppError(
        'Unable to load exercise videos. Please try again.',
        500,
        'VIDEO_FETCH_ERROR',
        true,
        error
      );
    }

    return {
      videos: data || [],
      total: count || 0,
      page,
      limit,
    };
  } catch (error) {
    console.error('Error in getExerciseVideos:', error);

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      'Unable to load exercise videos. Please try again.',
      500,
      'VIDEO_ERROR'
    );
  }
}

/**
 * Fetches a single exercise video by ID
 */
export async function getExerciseVideoById(
  id: string
): Promise<ExerciseVideoResponse> {
  try {
    const { data, error } = await supabase
      .from('exercise_videos')
      .select(
        `
        *,
        category:video_categories(*)
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching exercise video:', error);
      return {
        video: null as any,
        success: false,
        message: error.message,
      };
    }

    return {
      video: data,
      success: true,
    };
  } catch (error) {
    console.error('Error in getExerciseVideoById:', error);
    return {
      video: null as any,
      success: false,
      message: 'Failed to fetch video',
    };
  }
}

/**
 * Creates a new exercise video
 */
export async function createExerciseVideo(
  videoData: ExerciseVideoFormData
): Promise<ExerciseVideoResponse> {
  try {
    // Validate YouTube URL
    if (!isValidYouTubeUrl(videoData.youtubeUrl)) {
      return {
        video: null as any,
        success: false,
        message: 'Invalid YouTube URL format',
      };
    }

    const youtubeId = extractYouTubeId(videoData.youtubeUrl);
    if (!youtubeId) {
      return {
        video: null as any,
        success: false,
        message: 'Could not extract YouTube video ID',
      };
    }

    const thumbnailUrl = getYouTubeThumbnailUrl(youtubeId);

    const { data, error } = await supabase
      .from('exercise_videos')
      .insert([
        {
          title: videoData.title,
          description: videoData.description,
          youtube_url: videoData.youtubeUrl,
          youtube_id: youtubeId,
          category_id: videoData.categoryId,
          difficulty_level: videoData.difficulty,
          duration: videoData.duration * 60, // Convert minutes to seconds
          equipment_required: videoData.equipmentRequired,
          body_parts: videoData.bodyParts,
          tags: videoData.tags,
          thumbnail_url: thumbnailUrl,
        },
      ])
      .select(
        `
        *,
        category:video_categories(*)
      `
      )
      .single();

    if (error) {
      console.error('Error creating exercise video:', error);
      return {
        video: null as any,
        success: false,
        message: error.message,
      };
    }

    return {
      video: data,
      success: true,
      message: 'Video created successfully',
    };
  } catch (error) {
    console.error('Error in createExerciseVideo:', error);
    return {
      video: null as any,
      success: false,
      message: 'Failed to create video',
    };
  }
}

/**
 * Updates an existing exercise video
 */
export async function updateExerciseVideo(
  id: string,
  videoData: Partial<ExerciseVideoFormData>
): Promise<ExerciseVideoResponse> {
  try {
    const updateData: any = {
      ...videoData,
      updated_at: new Date().toISOString(),
    };

    // If YouTube URL is being updated, validate and extract ID
    if (videoData.youtubeUrl) {
      if (!isValidYouTubeUrl(videoData.youtubeUrl)) {
        return {
          video: null as any,
          success: false,
          message: 'Invalid YouTube URL format',
        };
      }

      const youtubeId = extractYouTubeId(videoData.youtubeUrl);
      if (!youtubeId) {
        return {
          video: null as any,
          success: false,
          message: 'Could not extract YouTube video ID',
        };
      }

      updateData.youtube_id = youtubeId;
      updateData.thumbnail_url = getYouTubeThumbnailUrl(youtubeId);
    }

    // Convert duration from minutes to seconds if provided
    if (videoData.duration !== undefined) {
      updateData.duration = videoData.duration * 60;
    }

    const { data, error } = await supabase
      .from('exercise_videos')
      .update(updateData)
      .eq('id', id)
      .select(
        `
        *,
        category:video_categories(*)
      `
      )
      .single();

    if (error) {
      console.error('Error updating exercise video:', error);
      return {
        video: null as any,
        success: false,
        message: error.message,
      };
    }

    return {
      video: data,
      success: true,
      message: 'Video updated successfully',
    };
  } catch (error) {
    console.error('Error in updateExerciseVideo:', error);
    return {
      video: null as any,
      success: false,
      message: 'Failed to update video',
    };
  }
}

/**
 * Deletes an exercise video (hard delete)
 */
export async function deleteExerciseVideo(
  id: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const { error } = await supabase
      .from('exercise_videos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting exercise video:', error);
      return {
        success: false,
        message: error.message,
      };
    }

    return {
      success: true,
      message: 'Video deleted successfully',
    };
  } catch (error) {
    console.error('Error in deleteExerciseVideo:', error);
    return {
      success: false,
      message: 'Failed to delete video',
    };
  }
}

// =====================================================
// SEARCH AND FILTERING
// =====================================================

/**
 * Searches exercise videos with advanced filtering
 */
export async function searchExerciseVideos(
  filters: VideoFilters,
  page = 1,
  limit = 20
): Promise<ExerciseVideosListResponse> {
  // If using demo config, return mock data
  if (isUsingDemoConfig.supabase) {
    console.warn('Using demo configuration - returning mock video data');
    return getMockVideoData(filters, page, limit);
  }

  try {
    let queryBuilder = supabase.from('exercise_videos').select(
      `
        *,
        category:video_categories(*)
      `,
      { count: 'exact' }
    );

    // Apply filters
    if (filters.categoryId) {
      queryBuilder = queryBuilder.eq('category_id', filters.categoryId);
    }

    if (filters.difficulty) {
      queryBuilder = queryBuilder.eq('difficulty_level', filters.difficulty);
    }

    if (filters.bodyParts && filters.bodyParts.length > 0) {
      queryBuilder = queryBuilder.overlaps('body_parts', filters.bodyParts);
    }

    if (filters.equipmentRequired && filters.equipmentRequired.length > 0) {
      queryBuilder = queryBuilder.overlaps(
        'equipment_required',
        filters.equipmentRequired
      );
    }

    if (filters.durationMin !== undefined) {
      queryBuilder = queryBuilder.gte('duration', filters.durationMin * 60);
    }

    if (filters.durationMax !== undefined) {
      queryBuilder = queryBuilder.lte('duration', filters.durationMax * 60);
    }

    if (filters.searchQuery) {
      queryBuilder = queryBuilder.or(
        `title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`
      );
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await queryBuilder
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching exercise videos:', error);
      return {
        videos: [],
        total: 0,
        page,
        limit,
      };
    }

    return {
      videos: data || [],
      total: count || 0,
      page,
      limit,
    };
  } catch (error) {
    console.error('Error in searchExerciseVideos:', error);
    return {
      videos: [],
      total: 0,
      page,
      limit,
    };
  }
}

/**
 * Gets videos by category with pagination
 */
export async function getVideosByCategory(
  categoryId: string,
  page = 1,
  limit = 20
): Promise<ExerciseVideosListResponse> {
  return searchExerciseVideos({ categoryId }, page, limit);
}

/**
 * Gets videos by difficulty level
 */
export async function getVideosByDifficulty(
  difficulty: VideoDifficulty,
  page = 1,
  limit = 20
): Promise<ExerciseVideosListResponse> {
  return searchExerciseVideos({ difficulty }, page, limit);
}

/**
 * Gets videos by body part
 */
export async function getVideosByBodyPart(
  bodyPart: string,
  page = 1,
  limit = 20
): Promise<ExerciseVideosListResponse> {
  return searchExerciseVideos({ bodyParts: [bodyPart] }, page, limit);
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Gets unique body parts from all videos for filtering
 */
export async function getUniqueBodyParts(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('exercise_videos')
      .select('body_parts');

    if (error) {
      console.error('Error fetching body parts:', error);
      return [];
    }

    const bodyPartsSet = new Set<string>();
    data?.forEach(video => {
      video.body_parts?.forEach((part: string) => bodyPartsSet.add(part));
    });

    return Array.from(bodyPartsSet).sort();
  } catch (error) {
    console.error('Error in getUniqueBodyParts:', error);
    return [];
  }
}

/**
 * Gets unique equipment types from all videos for filtering
 */
export async function getUniqueEquipmentTypes(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('exercise_videos')
      .select('equipment_required');

    if (error) {
      console.error('Error fetching equipment types:', error);
      return [];
    }

    const equipmentSet = new Set<string>();
    data?.forEach(video => {
      video.equipment_required?.forEach((equipment: string) =>
        equipmentSet.add(equipment)
      );
    });

    return Array.from(equipmentSet).sort();
  } catch (error) {
    console.error('Error in getUniqueEquipmentTypes:', error);
    return [];
  }
}

// =====================================================
// MOCK DATA FOR DEVELOPMENT
// =====================================================

/**
 * Returns mock video data when Supabase is not configured
 */
function getMockVideoData(
  filters: VideoFilters,
  page: number = 1,
  limit: number = 20
): ExerciseVideosListResponse {
  const mockVideos = [
    {
      id: 'mock-1',
      youtube_id: 'dQw4w9WgXcQ',
      title: 'Basic Neck Stretches',
      description:
        'Simple neck stretches to relieve tension and improve mobility.',
      category_id: 'neck',
      difficulty_level: 'beginner' as VideoDifficulty,
      duration: 300,
      equipment_required: [],
      body_parts: ['neck'],
      tags: ['stretching', 'mobility'],
      thumbnail_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
      created_at: new Date().toISOString(),
      category: {
        id: 'neck',
        name: 'Neck & Shoulders',
        description: 'Exercises for neck and shoulder pain',
        icon: '🦴',
        created_at: new Date().toISOString(),
      },
    },
    {
      id: 'mock-2',
      youtube_id: 'dQw4w9WgXcQ',
      title: 'Lower Back Strengthening',
      description:
        'Strengthen your lower back muscles with these safe exercises.',
      category_id: 'back',
      difficulty_level: 'intermediate' as VideoDifficulty,
      duration: 600,
      equipment_required: ['mat'],
      body_parts: ['lower back'],
      tags: ['strengthening', 'core'],
      thumbnail_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
      created_at: new Date().toISOString(),
      category: {
        id: 'back',
        name: 'Back & Spine',
        description: 'Exercises for back pain relief',
        icon: '🏃',
        created_at: new Date().toISOString(),
      },
    },
    {
      id: 'mock-3',
      youtube_id: 'dQw4w9WgXcQ',
      title: 'Knee Rehabilitation Exercises',
      description: 'Gentle exercises to help recover from knee injuries.',
      category_id: 'knee',
      difficulty_level: 'beginner' as VideoDifficulty,
      duration: 450,
      equipment_required: ['chair'],
      body_parts: ['knee'],
      tags: ['rehabilitation', 'recovery'],
      thumbnail_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
      created_at: new Date().toISOString(),
      category: {
        id: 'knee',
        name: 'Knee & Leg',
        description: 'Exercises for knee and leg issues',
        icon: '🦵',
        created_at: new Date().toISOString(),
      },
    },
    {
      id: 'mock-4',
      youtube_id: 'dQw4w9WgXcQ',
      title: 'Shoulder Mobility Routine',
      description:
        'Improve shoulder range of motion with these gentle exercises.',
      category_id: 'shoulder',
      difficulty_level: 'beginner' as VideoDifficulty,
      duration: 420,
      equipment_required: [],
      body_parts: ['shoulder'],
      tags: ['mobility', 'stretching'],
      thumbnail_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
      created_at: new Date().toISOString(),
      category: {
        id: 'shoulder',
        name: 'Shoulder & Arm',
        description: 'Exercises for shoulder and arm issues',
        icon: '💪',
        created_at: new Date().toISOString(),
      },
    },
    {
      id: 'mock-5',
      youtube_id: 'dQw4w9WgXcQ',
      title: 'Core Strengthening Basics',
      description:
        'Build a strong core foundation with these essential exercises.',
      category_id: 'core',
      difficulty_level: 'intermediate' as VideoDifficulty,
      duration: 720,
      equipment_required: ['mat'],
      body_parts: ['core', 'abs'],
      tags: ['strengthening', 'core'],
      thumbnail_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
      created_at: new Date().toISOString(),
      category: {
        id: 'core',
        name: 'Core & Abs',
        description: 'Core strengthening exercises',
        icon: '🎯',
        created_at: new Date().toISOString(),
      },
    },
    {
      id: 'mock-6',
      youtube_id: 'dQw4w9WgXcQ',
      title: 'Hip Flexor Stretches',
      description: 'Release tight hip flexors with these effective stretches.',
      category_id: 'hip',
      difficulty_level: 'beginner' as VideoDifficulty,
      duration: 360,
      equipment_required: ['mat'],
      body_parts: ['hip', 'pelvis'],
      tags: ['stretching', 'flexibility'],
      thumbnail_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
      created_at: new Date().toISOString(),
      category: {
        id: 'hip',
        name: 'Hip & Pelvis',
        description: 'Hip and pelvis exercises',
        icon: '🦴',
        created_at: new Date().toISOString(),
      },
    },
  ];

  // Apply basic filtering
  let filteredVideos = mockVideos;

  if (filters.difficulty) {
    filteredVideos = filteredVideos.filter(
      video => video.difficulty_level === filters.difficulty
    );
  }

  if (filters.categoryId) {
    filteredVideos = filteredVideos.filter(
      video => video.category_id === filters.categoryId
    );
  }

  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filteredVideos = filteredVideos.filter(
      video =>
        video.title.toLowerCase().includes(query) ||
        video.description.toLowerCase().includes(query)
    );
  }

  // Apply pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedVideos = filteredVideos.slice(startIndex, endIndex);

  // Transform mock data to match ExerciseVideo interface
  const transformedVideos = paginatedVideos.map((video: any) => ({
    id: video.id,
    youtubeId: video.youtube_id,
    youtubeUrl: `https://www.youtube.com/watch?v=${video.youtube_id}`,
    title: video.title,
    description: video.description,
    categoryId: video.category_id,
    difficulty: video.difficulty_level,
    duration: video.duration,
    equipmentRequired: video.equipment_required || [],
    bodyParts: video.body_parts || [],
    tags: video.tags || [],
    thumbnailUrl: video.thumbnail_url,
    isActive: true,
    createdAt: new Date(video.created_at || Date.now()),
    updatedAt: new Date(video.created_at || Date.now()),
    category: video.category
  }));

  return {
    videos: transformedVideos,
    total: filteredVideos.length,
    page,
    limit,
  };
}
