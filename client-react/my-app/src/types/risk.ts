export type RiskLevel = 'low' | 'medium' | 'high';

export interface RiskPredictionRequest {
  company_name: string;
  recent_data: {
    policy_news?: string[];
    user_complaints?: string[];
    text?: string;
  };
  graph_structure?: Record<string, any>;
}

export interface RiskPredictionScores {
  compliance_score: number;
  payment_score: number;
}

export interface RiskPredictionAnalysis {
  text_analysis?: {
    policy_sentiment?: string;
    complaint_count?: number;
    key_risk_factors?: string[];
  };
  graph_analysis?: {
    centrality_score?: number;
    neighbor_risk_level?: string;
    community_risk?: string;
  };
}

export interface RiskPredictionResult {
  compliance_risk: RiskLevel;
  payment_risk: RiskLevel;
  scores: RiskPredictionScores;
  prediction_id?: number;
  text_cnn_features?: number[];
  gcn_features?: number[];
  fused_features?: number[];
  analysis?: RiskPredictionAnalysis;
}

export interface BatchRiskPredictionRequest {
  company_names: string[];
}

export interface PredictionHistoryRequest {
  company_name: string;
  limit?: number;
}

export interface ApiEnvelope<T> {
  code: number;
  message: string;
  data?: T;
}
