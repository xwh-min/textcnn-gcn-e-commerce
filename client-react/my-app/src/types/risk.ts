// 风险等级枚举
export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

// 风险预测参数
export interface RiskPredictParams {
  company_id: string;
  features?: Record<string, any>;
}

// 风险预测结果
export interface RiskPredictResult {
  id: string;
  company_id: string;
  company_name: string;
  risk_score: number;
  risk_level: RiskLevel;
  risk_factors: string[];
  prediction_time: string;
  details: Record<string, any>;
}

// 批量风险预测参数
export interface BatchPredictParams {
  company_ids: string[];
  features?: Record<string, any>;
}

// 批量风险预测结果
export interface BatchPredictResult {
  id: string;
  status: string;
  total_count: number;
  success_count: number;
  failed_count: number;
  started_at: string;
  completed_at?: string;
}

// 风险报告导出参数
export interface ReportExportParams {
  result_id: string;
  format: 'pdf' | 'excel';
}

// 风险因素
export interface RiskFactor {
  name: string;
  value: number;
  weight: number;
  impact: 'positive' | 'negative';
}