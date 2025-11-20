/**
 * Database table interfaces
 */

export interface SurveyResponse {
  id: string;
  data: Record<string, any>;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      survey_responses: {
        Row: SurveyResponse;
        Insert: Omit<SurveyResponse, 'id' | 'created_at'>;
        Update: Partial<Omit<SurveyResponse, 'id' | 'created_at'>>;
      };
    };
  };
}
