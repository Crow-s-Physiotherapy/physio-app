/**
 * Backend Connection Test Utility
 *
 * Use this to test your Supabase connection and backend services
 */

import { databaseHelpers } from '../services/database';
import { getAvailableTimeSlots } from '../services/appointmentService';

export const testBackendConnection = async () => {
  console.log('🔍 Testing backend connection...');

  try {
    // Test 1: Database connection
    console.log('1. Testing database connection...');
    const dbTest = await databaseHelpers.testConnection();
    console.log('Database test result:', dbTest);

    // Test 2: Database health
    console.log('2. Testing database health...');
    const healthTest = await databaseHelpers.getHealthStatus();
    console.log('Database health:', healthTest);

    // Test 3: Available time slots
    console.log('3. Testing appointment service...');
    const startDate = new Date();
    const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    const timeSlots = await getAvailableTimeSlots({
      startDate,
      endDate,
      duration: 60,
    });

    console.log('Available time slots:', timeSlots.length);

    return {
      success: true,
      results: {
        database: dbTest,
        health: healthTest,
        timeSlots: timeSlots.length,
      },
    };
  } catch (error) {
    console.error('❌ Backend test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// You can call this function in your browser console to test
// testBackendConnection().then(result => console.log('Final result:', result));
