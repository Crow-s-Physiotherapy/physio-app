import type {
  VideoDifficulty,
  EquipmentType,
  ExerciseBodyPart,
} from '../types/video';

// =====================================================
// VIDEO URL VALIDATION AND PROCESSING
// =====================================================

/**
 * Regular expressions for different YouTube URL formats
 */
const YOUTUBE_URL_PATTERNS = [
  /^https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})(?:&.*)?$/,
  /^https?:\/\/(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})(?:\?.*)?$/,
  /^https?:\/\/(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})(?:\?.*)?$/,
  /^https?:\/\/(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})(?:\?.*)?$/,
];

/**
 * Validates if a string is a valid YouTube URL
 */
export function isValidYouTubeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;

  return YOUTUBE_URL_PATTERNS.some(pattern => pattern.test(url.trim()));
}

/**
 * Extracts YouTube video ID from various URL formats
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;

  const trimmedUrl = url.trim();

  for (const pattern of YOUTUBE_URL_PATTERNS) {
    const match = trimmedUrl.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Normalizes YouTube URL to standard watch format
 */
export function normalizeYouTubeUrl(url: string): string | null {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;

  return `https://www.youtube.com/watch?v=${videoId}`;
}

// YouTube utility functions moved to videoService.ts to avoid duplication

// =====================================================
// VIDEO METADATA VALIDATION
// =====================================================

/**
 * Validates video difficulty level
 */
export function isValidDifficulty(
  difficulty: string
): difficulty is VideoDifficulty {
  return ['beginner', 'intermediate', 'advanced'].includes(difficulty);
}

/**
 * Validates equipment type
 */
export function isValidEquipmentType(
  equipment: string
): equipment is EquipmentType {
  const validEquipment = [
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
  ];
  return validEquipment.includes(equipment);
}

/**
 * Validates body part
 */
export function isValidBodyPart(
  bodyPart: string
): bodyPart is ExerciseBodyPart {
  const validBodyParts = [
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
  ];
  return validBodyParts.includes(bodyPart);
}

/**
 * Validates video duration (in minutes)
 */
export function isValidDuration(duration: number): boolean {
  return typeof duration === 'number' && duration > 0 && duration <= 180; // Max 3 hours
}

/**
 * Validates video title
 */
export function isValidTitle(title: string): boolean {
  return (
    typeof title === 'string' && title.trim().length >= 3 && title.length <= 500
  );
}

/**
 * Validates video description
 */
export function isValidDescription(description: string): boolean {
  return typeof description === 'string' && description.length <= 5000;
}

// =====================================================
// VIDEO FILTERING AND SEARCH UTILITIES
// =====================================================

/**
 * Filters videos by search query (title, description, tags)
 */
export function matchesSearchQuery(video: any, query: string): boolean {
  if (!query || !query.trim()) return true;

  const searchTerm = query.toLowerCase().trim();
  const title = (video.title || '').toLowerCase();
  const description = (video.description || '').toLowerCase();
  const tags = (video.tags || []).join(' ').toLowerCase();

  return (
    title.includes(searchTerm) ||
    description.includes(searchTerm) ||
    tags.includes(searchTerm)
  );
}

/**
 * Filters videos by difficulty level
 */
export function matchesDifficulty(
  video: any,
  difficulty: VideoDifficulty
): boolean {
  return (
    video.difficulty_level === difficulty || video.difficulty === difficulty
  );
}

/**
 * Filters videos by body parts
 */
export function matchesBodyParts(video: any, bodyParts: string[]): boolean {
  if (!bodyParts || bodyParts.length === 0) return true;

  const videoBodyParts = video.body_parts || video.bodyParts || [];
  return bodyParts.some(part => videoBodyParts.includes(part));
}

/**
 * Filters videos by equipment
 */
export function matchesEquipment(video: any, equipment: string[]): boolean {
  if (!equipment || equipment.length === 0) return true;

  const videoEquipment =
    video.equipment_required || video.equipmentRequired || [];
  return equipment.some(eq => videoEquipment.includes(eq));
}

/**
 * Filters videos by duration range
 */
export function matchesDurationRange(
  video: any,
  minDuration?: number,
  maxDuration?: number
): boolean {
  const duration = video.duration || 0;
  const durationMinutes = duration > 1000 ? duration / 60 : duration; // Handle seconds vs minutes

  if (minDuration !== undefined && durationMinutes < minDuration) return false;
  if (maxDuration !== undefined && durationMinutes > maxDuration) return false;

  return true;
}

// =====================================================
// VIDEO SORTING UTILITIES
// =====================================================

/**
 * Sort videos by relevance score (for search results)
 */
export function sortByRelevance(videos: any[], query: string): any[] {
  if (!query || !query.trim()) return videos;

  const searchTerm = query.toLowerCase().trim();

  return videos.sort((a, b) => {
    const aTitle = (a.title || '').toLowerCase();
    const bTitle = (b.title || '').toLowerCase();

    // Exact title match gets highest score
    if (aTitle === searchTerm) return -1;
    if (bTitle === searchTerm) return 1;

    // Title starts with query gets higher score
    if (aTitle.startsWith(searchTerm) && !bTitle.startsWith(searchTerm))
      return -1;
    if (bTitle.startsWith(searchTerm) && !aTitle.startsWith(searchTerm))
      return 1;

    // Title contains query gets medium score
    if (aTitle.includes(searchTerm) && !bTitle.includes(searchTerm)) return -1;
    if (bTitle.includes(searchTerm) && !aTitle.includes(searchTerm)) return 1;

    // Fall back to creation date
    const aDate = new Date(a.created_at || a.createdAt || 0);
    const bDate = new Date(b.created_at || b.createdAt || 0);
    return bDate.getTime() - aDate.getTime();
  });
}

/**
 * Sort videos by popularity (creation date as fallback since view_count is removed)
 */
export function sortByPopularity(videos: any[]): any[] {
  return videos.sort((a, b) => {
    const aDate = new Date(a.created_at || a.createdAt || 0);
    const bDate = new Date(b.created_at || b.createdAt || 0);
    return bDate.getTime() - aDate.getTime();
  });
}

/**
 * Sort videos by date (newest first)
 */
export function sortByDate(videos: any[]): any[] {
  return videos.sort((a, b) => {
    const aDate = new Date(a.created_at || a.createdAt || 0);
    const bDate = new Date(b.created_at || b.createdAt || 0);
    return bDate.getTime() - aDate.getTime();
  });
}

/**
 * Sort videos by duration
 */
export function sortByDuration(videos: any[], ascending = true): any[] {
  return videos.sort((a, b) => {
    const aDuration = a.duration || 0;
    const bDuration = b.duration || 0;
    return ascending ? aDuration - bDuration : bDuration - aDuration;
  });
}

// =====================================================
// VIDEO FORMATTING UTILITIES
// =====================================================

/**
 * Formats duration from seconds to human-readable string
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    return remainingSeconds > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

/**
 * Formats difficulty level for display
 */
export function formatDifficulty(difficulty: VideoDifficulty): string {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
}

/**
 * Formats equipment list for display
 */
export function formatEquipmentList(equipment: string[]): string {
  if (!equipment || equipment.length === 0) return 'No equipment needed';
  if (equipment.includes('None')) return 'No equipment needed';

  return equipment.join(', ');
}

/**
 * Formats body parts list for display
 */
export function formatBodyPartsList(bodyParts: string[]): string {
  if (!bodyParts || bodyParts.length === 0) return 'General';

  return bodyParts.join(', ');
}

// =====================================================
// VIDEO RECOMMENDATION UTILITIES
// =====================================================

/**
 * Calculates similarity score between two videos
 */
export function calculateVideoSimilarity(video1: any, video2: any): number {
  let score = 0;

  // Same category
  if (
    video1.category_id === video2.category_id ||
    video1.categoryId === video2.categoryId
  ) {
    score += 3;
  }

  // Same difficulty
  if (
    video1.difficulty_level === video2.difficulty_level ||
    video1.difficulty === video2.difficulty
  ) {
    score += 2;
  }

  // Overlapping body parts
  const bodyParts1 = video1.body_parts || video1.bodyParts || [];
  const bodyParts2 = video2.body_parts || video2.bodyParts || [];
  const bodyPartOverlap = bodyParts1.filter((part: string) =>
    bodyParts2.includes(part)
  ).length;
  score += bodyPartOverlap;

  // Overlapping equipment
  const equipment1 =
    video1.equipment_required || video1.equipmentRequired || [];
  const equipment2 =
    video2.equipment_required || video2.equipmentRequired || [];
  const equipmentOverlap = equipment1.filter((eq: string) =>
    equipment2.includes(eq)
  ).length;
  score += equipmentOverlap * 0.5;

  return score;
}

/**
 * Gets recommended videos based on a reference video
 */
export function getRecommendedVideos(
  referenceVideo: any,
  allVideos: any[],
  limit = 5
): any[] {
  return allVideos
    .filter(video => video.id !== referenceVideo.id)
    .map(video => ({
      ...video,
      similarityScore: calculateVideoSimilarity(referenceVideo, video),
    }))
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, limit);
}
