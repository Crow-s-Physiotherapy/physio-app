// Common API response types and utilities

// Generic API response wrapper
export interface ApiResponse<T = any> {
  data?: T;
  success: boolean;
  message?: string;
  error?: ApiError;
}

// Error handling types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
}

// Pagination types
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Loading states
export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

export interface AsyncState<T> extends LoadingState {
  data?: T | null;
}

// Search and filter types
export interface SearchParams {
  query?: string;
  filters?: Record<string, any>;
  pagination?: PaginationParams;
}

export interface FilterOption {
  label: string;
  value: string | number;
  count?: number;
}

// File upload types
export interface FileUpload {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

// Notification types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  timestamp: Date;
}

// Calendar integration types
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendees?: string[];
  googleEventId?: string;
}

export interface CalendarAvailability {
  date: Date;
  timeSlots: {
    startTime: string;
    endTime: string;
    available: boolean;
  }[];
}

// Email notification types
export interface EmailTemplate {
  templateId: string;
  subject: string;
  variables: Record<string, string>;
}

export interface EmailNotification {
  to: string;
  template: EmailTemplate;
  priority?: 'low' | 'normal' | 'high';
}

// Database operation types
export type DatabaseOperation = 'create' | 'read' | 'update' | 'delete';

export interface DatabaseResult<T> {
  data?: T;
  error?: string;
  count?: number;
}

// Utility type helpers
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

// Form state management
export interface FormState<T> {
  values: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}

// Configuration types
export interface AppConfig {
  apiUrl: string;
  environment: 'development' | 'staging' | 'production';
  features: {
    donations: boolean;
    appointments: boolean;
    videoLibrary: boolean;
    assessments: boolean;
  };
}

// Theme and UI types
export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  borderRadius: string;
}

export type ComponentSize = 'sm' | 'md' | 'lg' | 'xl';
export type ComponentVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error';
