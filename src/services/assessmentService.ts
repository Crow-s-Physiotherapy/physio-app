import { supabase } from '../lib/supabase';
import type {
  SymptomAssessment,
  SymptomAssessmentFormData,
  AssessmentFilters,
} from '../types/assessment';

export const AssessmentService = {
  /**
   * Create a new symptom assessment
   */
  async createAssessment(
    data: SymptomAssessmentFormData
  ): Promise<SymptomAssessment> {
    try {
      const assessmentData = {
        patient_name: data.patientName,
        patient_email: data.patientEmail,
        pain_level: data.painLevel,
        assessment_date: new Date().toISOString().split('T')[0], // Current date
        symptoms: {
          primarySymptom: data.primarySymptom,
          secondarySymptoms: data.secondarySymptoms || [],
          onsetDate: data.onsetDate ? new Date(data.onsetDate) : null,
          triggerEvents: data.triggerEvents || [],
          worseningFactors: data.worseningFactors || [],
          relievingFactors: data.relievingFactors || [],
          dailyImpact: data.dailyImpact,
          painLocation: data.painLocation,
          symptomDuration: data.symptomDuration,
          previousTreatments: data.previousTreatments,
          currentMedications: data.currentMedications,
          additionalNotes: data.additionalNotes,
        },
      };

      const { data: assessment, error } = await supabase
        .from('symptom_assessments')
        .insert([assessmentData])
        .select()
        .single();

      if (error) {
        console.error('Error creating assessment:', error);
        throw new Error(
          `Failed to create symptom assessment: ${error.message}`
        );
      }

      return this.mapDatabaseToAssessment(assessment);
    } catch (error) {
      console.error('Assessment creation error:', error);
      throw error;
    }
  },

  /**
   * Get assessment by ID
   */
  async getAssessmentById(id: string): Promise<SymptomAssessment | null> {
    try {
      const { data: assessment, error } = await supabase
        .from('symptom_assessments')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Assessment not found
        }
        console.error('Error fetching assessment:', error);
        throw new Error(`Failed to fetch assessment: ${error.message}`);
      }

      return this.mapDatabaseToAssessment(assessment);
    } catch (error) {
      console.error('Assessment fetch error:', error);
      throw error;
    }
  },

  /**
   * Get assessments by patient email
   */
  async getAssessmentsByPatient(
    patientEmail: string
  ): Promise<SymptomAssessment[]> {
    try {
      const { data: assessments, error } = await supabase
        .from('symptom_assessments')
        .select('*')
        .eq('patient_email', patientEmail)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching patient assessments:', error);
        throw new Error(
          `Failed to fetch patient assessments: ${error.message}`
        );
      }

      return assessments.map(this.mapDatabaseToAssessment);
    } catch (error) {
      console.error('Patient assessments fetch error:', error);
      throw error;
    }
  },

  /**
   * Get assessments with filters
   */
  async getAssessments(
    filters: AssessmentFilters = {}
  ): Promise<SymptomAssessment[]> {
    try {
      let query = supabase.from('symptom_assessments').select('*');

      // Apply filters
      if (filters.patientEmail) {
        query = query.eq('patient_email', filters.patientEmail);
      }

      if (filters.painLevelMin !== undefined) {
        query = query.gte('pain_level', filters.painLevelMin);
      }

      if (filters.painLevelMax !== undefined) {
        query = query.lte('pain_level', filters.painLevelMax);
      }

      if (filters.dateFrom) {
        query = query.gte(
          'assessment_date',
          filters.dateFrom.toISOString().split('T')[0]
        );
      }

      if (filters.dateTo) {
        query = query.lte(
          'assessment_date',
          filters.dateTo.toISOString().split('T')[0]
        );
      }

      if (filters.primarySymptom) {
        query = query.ilike(
          'symptoms->primarySymptom',
          `%${filters.primarySymptom}%`
        );
      }

      // Order by most recent first
      query = query.order('created_at', { ascending: false });

      const { data: assessments, error } = await query;

      if (error) {
        console.error('Error fetching assessments:', error);
        throw new Error(`Failed to fetch assessments: ${error.message}`);
      }

      return assessments.map(this.mapDatabaseToAssessment);
    } catch (error) {
      console.error('Assessments fetch error:', error);
      throw error;
    }
  },

  /**
   * Update an existing assessment
   */
  async updateAssessment(
    id: string,
    data: Partial<SymptomAssessmentFormData>
  ): Promise<SymptomAssessment> {
    try {
      const updateData: any = {};

      if (data.patientName) updateData.patient_name = data.patientName;
      if (data.patientEmail) updateData.patient_email = data.patientEmail;
      if (data.painLevel !== undefined) updateData.pain_level = data.painLevel;

      // Update symptoms JSON if any symptom-related fields are provided
      if (
        data.primarySymptom ||
        data.secondarySymptoms ||
        data.dailyImpact ||
        data.painLocation ||
        data.symptomDuration ||
        data.previousTreatments ||
        data.currentMedications ||
        data.additionalNotes
      ) {
        // First get the current assessment to merge with existing symptoms
        const current = await this.getAssessmentById(id);
        if (!current) {
          throw new Error('Assessment not found');
        }

        updateData.symptoms = {
          ...current.symptoms,
          ...(data.primarySymptom && { primarySymptom: data.primarySymptom }),
          ...(data.secondarySymptoms && {
            secondarySymptoms: data.secondarySymptoms,
          }),
          ...(data.onsetDate && { onsetDate: new Date(data.onsetDate) }),
          ...(data.triggerEvents && { triggerEvents: data.triggerEvents }),
          ...(data.worseningFactors && {
            worseningFactors: data.worseningFactors,
          }),
          ...(data.relievingFactors && {
            relievingFactors: data.relievingFactors,
          }),
          ...(data.dailyImpact && { dailyImpact: data.dailyImpact }),
          ...(data.painLocation && { painLocation: data.painLocation }),
          ...(data.symptomDuration && {
            symptomDuration: data.symptomDuration,
          }),
          ...(data.previousTreatments && {
            previousTreatments: data.previousTreatments,
          }),
          ...(data.currentMedications && {
            currentMedications: data.currentMedications,
          }),
          ...(data.additionalNotes && {
            additionalNotes: data.additionalNotes,
          }),
        };
      }

      const { data: assessment, error } = await supabase
        .from('symptom_assessments')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating assessment:', error);
        throw new Error(`Failed to update assessment: ${error.message}`);
      }

      return this.mapDatabaseToAssessment(assessment);
    } catch (error) {
      console.error('Assessment update error:', error);
      throw error;
    }
  },

  /**
   * Delete an assessment
   */
  async deleteAssessment(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('symptom_assessments')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting assessment:', error);
        throw new Error(`Failed to delete assessment: ${error.message}`);
      }
    } catch (error) {
      console.error('Assessment deletion error:', error);
      throw error;
    }
  },

  /**
   * Map database record to SymptomAssessment type
   */
  mapDatabaseToAssessment(dbRecord: any): SymptomAssessment {
    return {
      id: dbRecord.id,
      patientName: dbRecord.patient_name,
      patientEmail: dbRecord.patient_email,
      painLevel: dbRecord.pain_level,
      painLocation: dbRecord.symptoms?.painLocation || [],
      symptomDuration: dbRecord.symptoms?.symptomDuration || '',
      previousTreatments: dbRecord.symptoms?.previousTreatments || '',
      currentMedications: dbRecord.symptoms?.currentMedications || '',
      additionalNotes: dbRecord.symptoms?.additionalNotes || '',
      symptoms: {
        primarySymptom: dbRecord.symptoms?.primarySymptom || '',
        secondarySymptoms: dbRecord.symptoms?.secondarySymptoms || [],
        onsetDate: dbRecord.symptoms?.onsetDate
          ? new Date(dbRecord.symptoms.onsetDate)
          : new Date(),
        triggerEvents: dbRecord.symptoms?.triggerEvents || [],
        worseningFactors: dbRecord.symptoms?.worseningFactors || [],
        relievingFactors: dbRecord.symptoms?.relievingFactors || [],
        dailyImpact: dbRecord.symptoms?.dailyImpact || 'moderate',
      },
      assessmentDate: new Date(dbRecord.assessment_date),
      recommendations: dbRecord.recommendations,
      createdAt: new Date(dbRecord.created_at),
      updatedAt: new Date(dbRecord.updated_at),
    };
  },

  /**
   * Generate a summary of the assessment for display purposes
   */
  generateAssessmentSummary(assessment: SymptomAssessment): string {
    const painDescription =
      assessment.painLevel <= 3
        ? 'Mild'
        : assessment.painLevel <= 6
          ? 'Moderate'
          : assessment.painLevel <= 8
            ? 'Severe'
            : 'Extreme';

    const locations = assessment.painLocation.join(', ');
    const duration = assessment.symptomDuration.replace(/-/g, ' ');

    return `${painDescription} pain (${assessment.painLevel}/10) in ${locations}. Duration: ${duration}. Primary symptom: ${assessment.symptoms.primarySymptom}. Daily impact: ${assessment.symptoms.dailyImpact}.`;
  },
};

export default AssessmentService;
