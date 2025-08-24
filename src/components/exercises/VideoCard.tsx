import React, { useState } from 'react';
import type { ExerciseVideo } from '../../types/video';

interface VideoCardProps {
  video: ExerciseVideo;
  onVideoSelect: (video: ExerciseVideo) => void;
  className?: string;
}

const VideoCard: React.FC<VideoCardProps> = ({
  video,
  onVideoSelect,
  className = '',
}) => {
  // Handle both camelCase (TypeScript) and snake_case (database) field names
  const youtubeId = (video as any).youtube_id || video.youtubeId;
  const thumbnailUrl = (video as any).thumbnail_url || video.thumbnailUrl;
  const difficulty = (video as any).difficulty_level || video.difficulty;
  const equipmentRequired =
    (video as any).equipment_required || video.equipmentRequired;
  const bodyParts = (video as any).body_parts || video.bodyParts;

  const finalThumbnailUrl =
    thumbnailUrl || `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
  const durationMinutes = Math.ceil(video.duration / 60);

  const [imageError, setImageError] = useState(false);
  const [currentThumbnailUrl, setCurrentThumbnailUrl] =
    useState(finalThumbnailUrl);

  // Handle thumbnail loading errors with multiple fallbacks
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;

    if (img.src.includes('hqdefault')) {
      // Try medium quality
      const newUrl = `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`;
      setCurrentThumbnailUrl(newUrl);
    } else if (img.src.includes('mqdefault')) {
      // Try default quality
      const newUrl = `https://img.youtube.com/vi/${youtubeId}/default.jpg`;
      setCurrentThumbnailUrl(newUrl);
    } else if (img.src.includes('default.jpg')) {
      // Try the 0.jpg format (sometimes works when others don't)
      const newUrl = `https://img.youtube.com/vi/${youtubeId}/0.jpg`;
      setCurrentThumbnailUrl(newUrl);
    } else {
      // All thumbnails failed, show placeholder
      setImageError(true);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleClick = () => {
    onVideoSelect(video);
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onVideoSelect(video);
    }
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer group ${className}`}
      onClick={handleClick}
      onKeyPress={handleKeyPress}
      tabIndex={0}
      role="button"
      aria-label={`Play video: ${video.title}`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-200 rounded-t-lg overflow-hidden">
        {imageError ? (
          // Placeholder when all thumbnails fail
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <div className="text-center">
              <svg
                className="w-12 h-12 text-gray-400 mx-auto mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <p className="text-xs text-gray-500">Video Thumbnail</p>
            </div>
          </div>
        ) : (
          <img
            src={currentThumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            loading="lazy"
            onError={handleImageError}
          />
        )}

        {/* Play button overlay */}
        <div className="absolute inset-0 bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
          <div className="bg-white bg-opacity-90 rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <svg
              className="w-6 h-6 text-blue-600"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>

        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 bg-opacity-75 text-white text-xs px-2 py-1 rounded">
          {durationMinutes} min
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3
          className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors overflow-hidden"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {video.title}
        </h3>

        {/* Description */}
        <p
          className="text-sm text-gray-600 mb-3 overflow-hidden"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {video.description}
        </p>

        {/* Metadata */}
        <div className="flex flex-wrap gap-2 mb-3">
          {/* Difficulty badge */}
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(difficulty)}`}
          >
            {difficulty}
          </span>

          {/* Category badge */}
          {video.category && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {video.category.name}
            </span>
          )}
        </div>

        {/* Body parts */}
        {bodyParts && bodyParts.length > 0 && (
          <div className="mb-2">
            <div className="flex flex-wrap gap-1">
              {bodyParts.slice(0, 3).map((bodyPart: string, index: number) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700"
                >
                  {bodyPart}
                </span>
              ))}
              {bodyParts.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                  +{bodyParts.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Equipment required */}
        {equipmentRequired && equipmentRequired.length > 0 && (
          <div className="flex items-center text-xs text-gray-500">
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
              />
            </svg>
            {equipmentRequired.includes('None')
              ? 'No equipment'
              : equipmentRequired.slice(0, 2).join(', ')}
            {equipmentRequired.length > 2 &&
              !equipmentRequired.includes('None') &&
              '...'}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCard;
