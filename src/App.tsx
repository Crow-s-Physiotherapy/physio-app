import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Suspense, lazy } from 'react';
import ErrorBoundary from './components/common/ErrorBoundary';
import { ToastProvider } from './contexts/ToastContext';
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/common/LoadingSpinner';

// Lazy load pages for code splitting
const Home = lazy(() => import('./pages/Home'));
const Booking = lazy(() => import('./pages/Booking'));
const Exercises = lazy(() => import('./pages/Exercises'));
const Donations = lazy(() => import('./pages/Donations'));
const About = lazy(() => import('./pages/About'));
const Admin = lazy(() => import('./pages/Admin'));
const AppointmentDetailsPage = lazy(
  () => import('./pages/AppointmentDetailsPage')
);
const CancelAppointmentPage = lazy(
  () => import('./pages/CancelAppointmentPage')
);
const ManageSubscription = lazy(() => import('./pages/ManageSubscription'));

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: false, // Disable retries for mutations to prevent duplicate operations
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <Router>
            <Layout>
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/booking" element={<Booking />} />
                  <Route path="/exercises" element={<Exercises />} />
                  <Route path="/donations" element={<Donations />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route
                    path="/appointment/:appointmentId"
                    element={<AppointmentDetailsPage />}
                  />
                  <Route
                    path="/cancel/:appointmentId"
                    element={<CancelAppointmentPage />}
                  />
                  <Route
                    path="/manage-subscription"
                    element={<ManageSubscription />}
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </Layout>
          </Router>
        </ToastProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

// 404 Not Found component
const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1
            className="text-4xl sm:text-6xl font-bold text-gray-300"
            aria-hidden="true"
          >
            404
          </h1>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mt-4">
            Page Not Found
          </h2>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            The page you're looking for doesn't exist.
          </p>
        </div>
        <a
          href="/"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-block focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px] flex items-center justify-center"
        >
          Go Home
        </a>
      </div>
    </div>
  );
};

export default App;
