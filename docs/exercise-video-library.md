# Exercise Video Library - Frontend Components

## Overview

The Exercise Video Library is a complete frontend implementation for displaying, filtering, and playing physiotherapy exercise videos. It provides a responsive, user-friendly interface for patients to browse and access exercise content.

## Components Implemented

### 1. VideoLibrary Component (`src/components/exercises/VideoLibrary.tsx`)
**Main container component that orchestrates the entire video library experience.**

**Features:**
- Grid layout for video display (responsive: 1 column mobile, 2 tablet, 3 desktop)
- Pagination with "Load More" functionality (12 videos per page)
- Real-time video count display
- Loading states with skeleton placeholders
- Error handling with retry functionality
- Empty state messaging with filter clearing
- Integration with search and filtering

**Key Props:**
- `className?: string` - Optional CSS classes

### 2. VideoCard Component (`src/components/exercises/VideoCard.tsx`)
**Individual video card displaying video metadata and thumbnail.**

**Features:**
- YouTube thumbnail display with multiple fallback URLs
- Video metadata (title, description, duration, difficulty)
- Category and body part badges
- Equipment requirements display
- Hover effects and animations
- Keyboard accessibility (Enter/Space to select)
- Error handling for failed thumbnails

**Key Props:**
- `video: ExerciseVideo` - Video data object
- `onVideoSelect: (video: ExerciseVideo) => void` - Callback when video is selected
- `className?: string` - Optional CSS classes

### 3. VideoPlayer Component (`src/components/exercises/VideoPlayer.tsx`)
**Modal video player with YouTube iframe integration.**

**Features:**
- Full-screen modal overlay
- YouTube iframe with optimized parameters
- Video metadata display (description, body parts, equipment, tags)
- Embedding error handling with "Watch on YouTube" fallback
- Keyboard navigation (Esc to close)
- Click-outside-to-close functionality
- Responsive design

**Key Props:**
- `video: ExerciseVideo | null` - Video to play
- `isOpen: boolean` - Modal visibility state
- `onClose: () => void` - Close callback
- `onVideoEnd?: () => void` - Optional video end callback

### 4. CategoryFilter Component (`src/components/exercises/CategoryFilter.tsx`)
**Advanced filtering sidebar with multiple filter options.**

**Features:**
- Search query input
- Category dropdown selection
- Difficulty level selection
- Duration range filters (min/max minutes)
- Body parts multi-select checkboxes
- Equipment multi-select checkboxes
- Clear all filters functionality
- Mobile-responsive collapsible design
- Real-time filter application

**Key Props:**
- `filters: VideoFilters` - Current filter state
- `onFiltersChange: (filters: VideoFilters) => void` - Filter change callback
- `className?: string` - Optional CSS classes

## Data Flow

### Video Data Structure
The components handle both database snake_case and TypeScript camelCase field names:

```typescript
interface ExerciseVideo {
  id: string;
  title: string;
  description: string;
  youtube_id: string;        // Database field
  youtubeId: string;         // TypeScript field
  youtube_url: string;       // Database field
  youtubeUrl: string;        // TypeScript field
  thumbnail_url: string;     // Database field
  thumbnailUrl: string;      // TypeScript field
  difficulty_level: string;  // Database field
  difficulty: string;        // TypeScript field
  duration: number;          // Duration in seconds
  equipment_required: string[]; // Database field
  equipmentRequired: string[];  // TypeScript field
  body_parts: string[];      // Database field
  bodyParts: string[];       // TypeScript field
  tags: string[];
  category: VideoCategory;
  is_active: boolean;
}
```

### Filter System
```typescript
interface VideoFilters {
  categoryId?: string;
  difficulty?: VideoDifficulty;
  bodyParts?: string[];
  equipmentRequired?: string[];
  durationMin?: number;
  durationMax?: number;
  searchQuery?: string;
  isActive?: boolean;
}
```

## Integration Points

### Services Used
- `searchExerciseVideos()` - Main video fetching with filters and pagination
- `getVideoCategories()` - Fetch available categories
- `getUniqueBodyParts()` - Get available body parts for filtering
- `getUniqueEquipmentTypes()` - Get available equipment for filtering

### YouTube Integration
- Thumbnail URLs: `https://img.youtube.com/vi/{videoId}/hqdefault.jpg`
- Embed URLs: `https://www.youtube.com/embed/{videoId}`
- Fallback qualities: hqdefault → mqdefault → default → 0.jpg
- Embed parameters: `?rel=0&modestbranding=1&fs=1&cc_load_policy=1&iv_load_policy=3&showinfo=0`

## Responsive Design

### Breakpoints
- **Mobile (< 768px)**: 1 column grid, collapsible filters
- **Tablet (768px - 1024px)**: 2 column grid
- **Desktop (> 1024px)**: 3 column grid, sidebar filters

### Mobile Optimizations
- Touch-friendly tap targets
- Collapsible filter sidebar
- Optimized image loading
- Swipe-friendly card interactions

## Accessibility Features

### Keyboard Navigation
- Tab navigation through all interactive elements
- Enter/Space to select videos
- Esc to close modal
- Focus management in modal

### Screen Reader Support
- ARIA labels for video cards
- Role attributes for interactive elements
- Alt text for all images
- Semantic HTML structure

### Visual Accessibility
- High contrast colors
- Clear focus indicators
- Readable font sizes
- Color-blind friendly difficulty badges

## Performance Optimizations

### Image Loading
- Lazy loading for thumbnails
- Multiple fallback URLs
- Error handling with placeholders
- Optimized thumbnail sizes

### Data Loading
- Pagination to limit initial load
- Efficient database queries with count
- Loading states to prevent layout shift
- Error boundaries for graceful failures

### Bundle Optimization
- Tree-shaking friendly exports
- Minimal dependencies
- Optimized re-renders with React.memo potential

## Error Handling

### Thumbnail Errors
1. Try hqdefault.jpg (high quality)
2. Fallback to mqdefault.jpg (medium quality)
3. Fallback to default.jpg (standard quality)
4. Fallback to 0.jpg (alternative format)
5. Show placeholder with video icon

### Video Embedding Errors
- Detect embedding restrictions
- Show "Watch on YouTube" button
- Provide direct YouTube link
- Maintain modal functionality

### Network Errors
- Retry functionality for failed requests
- Clear error messaging
- Graceful degradation
- Offline state handling

## Usage Example

```tsx
import { VideoLibrary } from '../components/exercises';

const ExercisesPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-12">
      <VideoLibrary />
    </div>
  );
};
```

## Database Scripts

### Population Scripts
- `npm run db:populate-videos` - Populate database with test videos
- `scripts/populate-test-videos.js` - Node.js population script
- `scripts/populate-test-videos.sql` - SQL population script

### Utility Scripts
- `scripts/known-embeddable-videos.js` - Add known working videos
- `scripts/fix-broken-video.js` - Fix individual broken videos

## Debug Tools

### Debug Routes (Development Only)
- `/debug/youtube` - Test YouTube embedding
- `/debug/videocard` - Test video card rendering
- `/debug/videodata` - Inspect database data

## Requirements Satisfied

✅ **4.1** - VideoLibrary component with grid layout for video display
✅ **4.2** - CategoryFilter component for filtering videos by category and difficulty  
✅ **4.3** - VideoCard component showing video details and metadata
✅ **4.3** - VideoPlayer component with YouTube iframe integration
✅ **6.1** - Responsive design for mobile video browsing

## Future Enhancements

### Potential Improvements
- Video favorites/bookmarking
- Progress tracking for watched videos
- Video recommendations based on viewing history
- Offline video caching
- Advanced search with autocomplete
- Video playlists/programs
- Social sharing functionality
- Video ratings and reviews

### Performance Enhancements
- Virtual scrolling for large video lists
- Image preloading for next page
- Service worker for offline functionality
- CDN integration for thumbnails

## Maintenance Notes

### Regular Tasks
- Monitor YouTube video availability
- Update broken video links
- Review and update video metadata
- Performance monitoring
- Accessibility audits

### Known Limitations
- Depends on YouTube's embedding policies
- Thumbnail availability varies by video
- Network-dependent functionality
- Limited offline capabilities

---

**Status**: ✅ Complete
**Last Updated**: July 28, 2025
**Components**: 4 main components + utilities
**Test Coverage**: Manual testing with debug tools
**Browser Support**: Modern browsers with ES6+ support