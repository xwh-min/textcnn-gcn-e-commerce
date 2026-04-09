import request from './request';

export interface RiskPredictParams {
  company_id: string;
  features?: Record<string, any>;
}

export interface RiskPredictResult {
  id: string;
  company_id: string;
  company_name: string;
  risk_score: number;
  risk_level: string;
  risk_factors: string[];
  prediction_time: string;
  details: Record<string, any>;
}

export interface BatchPredictParams {
  company_ids: string[];
  features?: Record<string, any>;
}

export interface BatchPredictResult {
  id: string;
  status: string;
  total_count: number;
  success_count: number;
  failed_count: number;
  started_at: string;
  completed_at?: string;
}

export const riskService = {
  // 单次风险预测
  singlePredict: (params: RiskPredictParams) => {
    return request.post<RiskPredictResult>('/risk/predict', params);
  },
  // 批量风险预测
  batchPredict: (params: BatchPredictParams) => {
    return request.post<BatchPredictResult>('/risk/predict/batch', params);
  },
  // 获取预测结果列表
  getPredictResults: (params?: { page?: number; size?: number; company_id?: string; risk_level?: string; start_date?: string; end_date?: string }) => {
    return request.get<{ list: RiskPredictResult[]; total: number }>('/risk/results', { params });
  },
  // 获取预测结果详情
  getPredictResultDetail: (id: string) => {
    return request.get<RiskPredictResult>(`/risk/results/${id}`);
  },
  // 导出风险报告
  exportReport: (params: { result_id: string; format: 'pdf' | 'excel' }) => {
    return request.get('/risk/report/export', { params, responseType: 'blob' });
  },
};