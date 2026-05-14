import { apiService } from './api';
import type {
  RiskPredictionRequest,
  RiskPredictionResult,
  BatchRiskPredictionRequest,
  PredictionHistoryRequest,
  ApiEnvelope,
} from '@/src/types/risk';

export const riskService = {
  predict: (params: RiskPredictionRequest): Promise<ApiEnvelope<RiskPredictionResult>> => {
    return apiService.predictRisk(params);
  },

  batchPredict: (
    params: BatchRiskPredictionRequest
  ): Promise<ApiEnvelope<RiskPredictionResult>> => {
    return apiService.batchPredictRisk(params) as Promise<ApiEnvelope<RiskPredictionResult>>;
  },

  getHistory: (
    params: PredictionHistoryRequest
  ): Promise<ApiEnvelope<RiskPredictionResult>> => {
    return apiService.getRiskHistory(params) as Promise<ApiEnvelope<RiskPredictionResult>>;
  },

  getHealth: () => {
    return apiService.getRiskPredictorHealth();
  },
};
