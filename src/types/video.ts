// Exercise video-related type definitions

export interface ExerciseVideo {
  id: string;
  youtubeId: string;
  youtubeUrl: string;
  title: string;
  description: string;
  category: VideoCategory;
  categoryId: string;
  difficulty: VideoDifficulty;
  duration: number; // in minutes
  equipmentRequired: string[];
  bodyParts: string[];
  tags: string[];
  thumbnailUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoCategory {
  id: string;
  name: string;
  description: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Form data types for video management
export interface ExerciseVideoFormData {
  title: string;
  description: string;
  youtubeUrl: string;
  categoryId: string;
  difficulty: VideoDifficulty;
  duration: number;
  equipmentRequired: string[];
  bodyParts: string[];
  tags: string[];
}

export interface VideoCategoryFormData {
  name: string;
  description: string;
  icon?: string;
}

// API response types
export interface ExerciseVideoResponse {
  video: ExerciseVideo;
  success: boolean;
  message?: string;
}

export interface ExerciseVideosListResponse {
  videos: ExerciseVideo[];
  total: number;
  page: number;
  limit: number;
}

export interface VideoCategoriesResponse {
  categories: VideoCategory[];
  success: boolean;
}

// Utility types
export type VideoDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface VideoFilters {
  categoryId?: string;
  difficulty?: VideoDifficulty;
  bodyParts?: string[];
  equipmentRequired?: string[];
  durationMin?: number;
  durationMax?: number;
  searchQuery?: string;
}

export interface VideoSearchParams {
  query?: string;
  category?: string;
  difficulty?: VideoDifficulty;
  bodyPart?: string;
  equipment?: string;
  page?: number;
  limit?: number;
}

// YouTube API types removed - using static thumbnails instead

// Equipment categories
export const EQUIPMENT_TYPES = [
  'None',
  'Resistance Bands',
  'Dumbbells',
  'Exercise Ball',
  'Yoga Mat',
  'Foam Roller',
  'Pilates Ring',
  'Stability Ball',
  'Theraband',
  'Chair',
  'Wall',
] as const;

export type EquipmentType = (typeof EQUIPMENT_TYPES)[number];

// Body parts for exercise targeting
export const EXERCISE_BODY_PARTS = [
  'Full Body',
  'Core',
  'Back',
  'Neck',
  'Shoulders',
  'Arms',
  'Chest',
  'Hips',
  'Legs',
  'Glutes',
  'Calves',
  'Feet',
] as const;

export type ExerciseBodyPart = (typeof EXERCISE_BODY_PARTS)[number];
