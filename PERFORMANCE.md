# Performance Optimization Guide

This document outlines the performance optimizations implemented in the Fisio Project.

## Code Splitting and Lazy Loading

### Route-based Code Splitting
- All page components are lazy-loaded using `React.lazy()`
- Routes are wrapped in `Suspense` with loading fallbacks
- This reduces the initial bundle size and improves First Contentful Paint (FCP)

### Implementation
```typescript
// Lazy load pages for code splitting
const Home = lazy(() => import('./pages/Home'));
const Booking = lazy(() => import('./pages/Booking'));
// ... other pages

// Wrap routes in Suspense
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/" element={<Home />} />
    // ... other routes
  </Routes>
</Suspense>
```

## React Query Integration

### Efficient Data Fetching
- Implemented React Query (TanStack Query) for all API calls
- Automatic caching, background updates, and error handling
- Reduced unnecessary network requests

### Key Features
- **Stale-while-revalidate**: Shows cached data while fetching fresh data
- **Automatic retries**: Failed requests are retried with exponential backoff
- **Background updates**: Data is refreshed in the background
- **Optimistic updates**: UI updates immediately for better UX

### Query Configuration
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});
```

## Bundle Optimization

### Manual Chunk Splitting
- Vendor libraries are split into separate chunks for better caching
- Common dependencies are grouped together
- Service-specific chunks for better cache invalidation

### Chunk Configuration
```typescript
manualChunks: {
  'react-vendor': ['react', 'react-dom'],
  'router-vendor': ['react-router-dom'],
  'query-vendor': ['@tanstack/react-query'],
  'form-vendor': ['react-hook-form', '@hookform/resolvers', 'yup'],
  'stripe-vendor': ['@stripe/stripe-js', '@stripe/react-stripe-js'],
  'supabase-vendor': ['@supabase/supabase-js'],
}
```

## Image Optimization

### OptimizedImage Component
- Lazy loading with Intersection Observer
- Automatic quality selection for YouTube thumbnails
- Placeholder support and error handling
- Responsive image loading

### Features
- **Lazy Loading**: Images load only when they enter the viewport
- **Quality Optimization**: Different qualities based on image size
- **Error Handling**: Graceful fallbacks for broken images
- **Placeholder Support**: Smooth loading experience

## Performance Monitoring

### Performance Monitor Utility
- Tracks operation timing and performance metrics
- Identifies slow operations (>100ms)
- Web Vitals monitoring (LCP, FID, CLS)
- Resource timing analysis

### Usage
```typescript
// Measure function performance
await performanceMonitor.measure('api-call', async () => {
  return await apiCall();
});

// Monitor Web Vitals
webVitalsMonitor.logMetrics();
```

## Service Worker Implementation

### Caching Strategy
- Cache-first strategy for static assets
- Network-first for API calls
- Offline fallback for navigation requests

### Features
- **Static Asset Caching**: CSS, JS, and image files
- **Runtime Caching**: API responses and dynamic content
- **Offline Support**: Basic offline functionality
- **Background Sync**: Queue actions when offline

## Build Optimizations

### Vite Configuration
- Terser minification with console.log removal in production
- Source map generation disabled for production
- Optimized dependency pre-bundling
- Chunk size warnings for large bundles

### Production Optimizations
```typescript
build: {
  minify: 'terser',
  terserOptions: {
    compress: {
      drop_console: true, // Remove console.log in production
      drop_debugger: true,
    },
  },
  chunkSizeWarningLimit: 1000,
}
```

## Testing Strategy

### Unit Tests
- Critical components and services are unit tested
- React Query hooks are tested with proper mocking
- Utility functions have comprehensive test coverage

### End-to-End Tests
- Complete user flows are tested with Playwright
- Performance metrics are validated in E2E tests
- Mobile responsiveness is tested across devices

### Performance Tests
- Core Web Vitals monitoring in E2E tests
- Load time validation
- Bundle size monitoring

## Monitoring and Analytics

### Performance Metrics
- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1

### Monitoring Tools
- Built-in performance monitoring utilities
- Web Vitals tracking
- Resource timing analysis
- Error boundary reporting

## Best Practices

### Code Organization
- Lazy load components and routes
- Use React.memo for expensive components
- Implement proper error boundaries
- Optimize re-renders with useMemo and useCallback

### Network Optimization
- Use React Query for all API calls
- Implement proper caching strategies
- Minimize API payload sizes
- Use compression for static assets

### Asset Optimization
- Lazy load images and videos
- Use appropriate image formats and sizes
- Implement progressive loading
- Minimize CSS and JavaScript bundles

## Scripts

### Performance Analysis
```bash
# Analyze bundle size
npm run build:analyze

# Run performance tests
npm run test:e2e

# Generate test coverage
npm run test:coverage
```

### Development
```bash
# Run with performance monitoring
npm run dev

# Type checking
npm run type-check

# Linting and formatting
npm run lint:fix
npm run format
```

## Future Optimizations

### Planned Improvements
- Implement virtual scrolling for large lists
- Add progressive web app (PWA) features
- Implement server-side rendering (SSR)
- Add image compression and WebP support
- Implement advanced caching strategies

### Monitoring
- Set up real user monitoring (RUM)
- Implement performance budgets
- Add automated performance regression testing
- Monitor Core Web Vitals in production