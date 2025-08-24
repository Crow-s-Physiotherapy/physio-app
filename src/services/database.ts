import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';

type Tables = Database['public']['Tables'];

// Note: Appointments are now managed via Edge Functions with Google Calendar as the primary data store
// The appointmentsService has been removed as it's no longer needed

// Symptom Assessments CRUD operations
export const symptomAssessmentsService = {
  // Get all assessments
  async getAll() {
    const { data, error } = await supabase
      .from('symptom_assessments')
      .select('*')
      .order('assessment_date', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get assessment by ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('symptom_assessments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create new assessment
  async create(assessment: Tables['symptom_assessments']['Insert']) {
    const { data, error } = await supabase
      .from('symptom_assessments')
      .insert(assessment)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update assessment
  async update(id: string, updates: Tables['symptom_assessments']['Update']) {
    const { data, error } = await supabase
      .from('symptom_assessments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete assessment
  async delete(id: string) {
    const { error } = await supabase
      .from('symptom_assessments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// Video Categories CRUD operations
export const videoCategoriesService = {
  // Get all categories
  async getAll() {
    const { data, error } = await supabase
      .from('video_categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Get category by ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('video_categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create new category
  async create(category: Tables['video_categories']['Insert']) {
    const { data, error } = await supabase
      .from('video_categories')
      .insert(category)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update category
  async update(id: string, updates: Tables['video_categories']['Update']) {
    const { data, error } = await supabase
      .from('video_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete category
  async delete(id: string) {
    const { error } = await supabase
      .from('video_categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// Exercise Videos CRUD operations
export const exerciseVideosService = {
  // Get all videos
  async getAll() {
    const { data, error } = await supabase
      .from('exercise_videos')
      .select(
        `
        *,
        video_categories (
          id,
          name,
          description
        )
      `
      )
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get videos by category
  async getByCategory(categoryId: string) {
    const { data, error } = await supabase
      .from('exercise_videos')
      .select(
        `
        *,
        video_categories (
          id,
          name,
          description
        )
      `
      )
      .eq('category_id', categoryId)
      .order('title', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Get video by ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('exercise_videos')
      .select(
        `
        *,
        video_categories (
          id,
          name,
          description
        )
      `
      )
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create new video
  async create(video: Tables['exercise_videos']['Insert']) {
    const { data, error } = await supabase
      .from('exercise_videos')
      .insert(video)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update video
  async update(id: string, updates: Tables['exercise_videos']['Update']) {
    const { data, error } = await supabase
      .from('exercise_videos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete video
  async delete(id: string) {
    const { error } = await supabase
      .from('exercise_videos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Search videos by title or tags
  async search(query: string) {
    const { data, error } = await supabase
      .from('exercise_videos')
      .select(
        `
        *,
        video_categories (
          id,
          name,
          description
        )
      `
      )
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order('title', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Get videos by difficulty level
  async getByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced') {
    const { data, error } = await supabase
      .from('exercise_videos')
      .select(
        `
        *,
        video_categories (
          id,
          name,
          description
        )
      `
      )
      .eq('difficulty_level', difficulty)
      .order('title', { ascending: true });

    if (error) throw error;
    return data;
  },
};

// Donations CRUD operations
export const donationsService = {
  // Get all public donations (non-anonymous)
  async getPublic() {
    const { data, error } = await supabase
      .from('donations')
      .select('*')
      .eq('is_anonymous', false)
      .eq('payment_status', 'completed')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get donation by ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('donations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create new donation
  async create(donation: Tables['donations']['Insert']) {
    const { data, error } = await supabase
      .from('donations')
      .insert(donation)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update donation (typically for payment status updates)
  async update(id: string, updates: Tables['donations']['Update']) {
    const { data, error } = await supabase
      .from('donations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get donation statistics
  async getStats() {
    const { data, error } = await supabase
      .from('donations')
      .select('amount, currency, payment_status')
      .eq('payment_status', 'completed');

    if (error) throw error;

    const totalAmount =
      data?.reduce((sum, donation) => sum + donation.amount, 0) || 0;
    const totalDonations = data?.length || 0;

    return {
      totalAmount,
      totalDonations,
      donations: data,
    };
  },
};

// Database helper functions
export const databaseHelpers = {
  // Test database connection
  async testConnection() {
    try {
      const { error } = await supabase
        .from('video_categories')
        .select('count')
        .limit(1);

      if (error) throw error;
      return { success: true, message: 'Database connection successful' };
    } catch (error) {
      return {
        success: false,
        message: `Database connection failed: ${error}`,
      };
    }
  },

  // Get database health status
  async getHealthStatus() {
    try {
      const [categories, videos, assessments, donations] = await Promise.all([
        supabase.from('video_categories').select('count').limit(1),
        supabase.from('exercise_videos').select('count').limit(1),
        supabase.from('symptom_assessments').select('count').limit(1),
        supabase.from('donations').select('count').limit(1),
      ]);

      return {
        success: true,
        tables: {
          video_categories: !categories.error,
          exercise_videos: !videos.error,
          symptom_assessments: !assessments.error,
          donations: !donations.error,
          // Note: appointments are now managed via Edge Functions with Google Calendar
        },
      };
    } catch (error) {
      return { success: false, error: error };
    }
  },
};
