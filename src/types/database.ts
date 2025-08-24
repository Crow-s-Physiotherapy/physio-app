export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      appointments: {
        Row: {
          id: string;
          patient_name: string;
          patient_email: string;
          patient_phone: string;
          appointment_date: string;
          appointment_time: string;
          duration: number;
          status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed';
          google_event_id?: string;
          notes?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_name: string;
          patient_email: string;
          patient_phone: string;
          appointment_date: string;
          appointment_time: string;
          duration?: number;
          status?: 'scheduled' | 'confirmed' | 'cancelled' | 'completed';
          google_event_id?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          patient_name?: string;
          patient_email?: string;
          patient_phone?: string;
          appointment_date?: string;
          appointment_time?: string;
          duration?: number;
          status?: 'scheduled' | 'confirmed' | 'cancelled' | 'completed';
          google_event_id?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      symptom_assessments: {
        Row: {
          id: string;
          patient_name: string;
          patient_email: string;
          symptoms: Json;
          pain_level: number;
          assessment_date: string;
          recommendations?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_name: string;
          patient_email: string;
          symptoms: Json;
          pain_level: number;
          assessment_date: string;
          recommendations?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          patient_name?: string;
          patient_email?: string;
          symptoms?: Json;
          pain_level?: number;
          assessment_date?: string;
          recommendations?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      video_categories: {
        Row: {
          id: string;
          name: string;
          description?: string;
          icon?: string;
          sort_order?: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          icon?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          icon?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      exercise_videos: {
        Row: {
          id: string;
          title: string;
          description?: string;
          youtube_id: string;
          youtube_url: string;
          category_id: string;
          duration?: number;
          difficulty_level: 'beginner' | 'intermediate' | 'advanced';
          equipment_required?: string[];
          body_parts?: string[];
          tags?: string[];
          thumbnail_url?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string;
          youtube_id: string;
          youtube_url: string;
          category_id: string;
          duration?: number;
          difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
          equipment_required?: string[];
          body_parts?: string[];
          tags?: string[];
          thumbnail_url?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          youtube_id?: string;
          youtube_url?: string;
          category_id?: string;
          duration?: number;
          difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
          equipment_required?: string[];
          body_parts?: string[];
          tags?: string[];
          thumbnail_url?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      donations: {
        Row: {
          id: string;
          donor_name?: string;
          donor_email?: string;
          amount: number;
          currency: string;
          payment_status: 'pending' | 'completed' | 'failed' | 'cancelled';
          stripe_payment_intent_id?: string;
          message?: string;
          is_anonymous: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          donor_name?: string;
          donor_email?: string;
          amount: number;
          currency: string;
          payment_status?: 'pending' | 'completed' | 'failed' | 'cancelled';
          stripe_payment_intent_id?: string;
          message?: string;
          is_anonymous?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          donor_name?: string;
          donor_email?: string;
          amount?: number;
          currency?: string;
          payment_status?: 'pending' | 'completed' | 'failed' | 'cancelled';
          stripe_payment_intent_id?: string;
          message?: string;
          is_anonymous?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
