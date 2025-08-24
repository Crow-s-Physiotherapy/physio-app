import { supabase } from '../lib/supabase';
import { videoCategoriesService } from '../services/database';

// Sample data for initial setup
const sampleCategories = [
  {
    name: 'Back Pain Relief',
    description:
      'Exercises specifically designed to alleviate back pain and improve spinal health',
  },
  {
    name: 'Neck and Shoulder',
    description:
      'Targeted exercises for neck and shoulder pain relief and mobility',
  },
  {
    name: 'Knee Rehabilitation',
    description:
      'Rehabilitation exercises for knee injuries and pain management',
  },
  {
    name: 'General Stretching',
    description:
      'General stretching routines for overall flexibility and wellness',
  },
  {
    name: 'Posture Correction',
    description: 'Exercises to improve posture and prevent related pain',
  },
];

// Initialize database with sample data
export async function initializeDatabase() {
  try {
    console.log('Initializing database with sample data...');

    // Check if categories already exist
    const existingCategories = await videoCategoriesService.getAll();

    if (existingCategories.length === 0) {
      console.log('Creating sample video categories...');

      for (const category of sampleCategories) {
        await videoCategoriesService.create(category);
        console.log(`Created category: ${category.name}`);
      }
    } else {
      console.log('Categories already exist, skipping initialization');
    }

    console.log('Database initialization completed successfully');
    return { success: true, message: 'Database initialized successfully' };
  } catch (error) {
    console.error('Database initialization failed:', error);
    return {
      success: false,
      message: `Database initialization failed: ${error}`,
    };
  }
}

// Utility function to clear all data (for development/testing)
export async function clearDatabase() {
  try {
    console.log('Clearing database...');

    // Clear in reverse order due to foreign key constraints
    await supabase
      .from('exercise_videos')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase
      .from('video_categories')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase
      .from('appointments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase
      .from('symptom_assessments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase
      .from('donations')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    console.log('Database cleared successfully');
    return { success: true, message: 'Database cleared successfully' };
  } catch (error) {
    console.error('Database clearing failed:', error);
    return { success: false, message: `Database clearing failed: ${error}` };
  }
}
