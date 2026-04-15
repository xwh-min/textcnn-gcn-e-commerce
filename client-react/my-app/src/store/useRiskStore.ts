import { create } from 'zustand';

interface RiskPredictResult {
  id: string;
  company_id: string;
  company_name: string;
  risk_score: number;
  risk_level: string;
  risk_factors: string[];
  prediction_time: string;
  details: Record<string, any>;
}

interface RiskState {
  recentResults: RiskPredictResult[];
  currentResult: RiskPredictResult | null;
  addResult: (result: RiskPredictResult) => void;
  setCurrentResult: (result: RiskPredictResult) => void;
  clearResults: () => void;
}

export const useRiskStore = create<RiskState>((set) => ({
  recentResults: [],
  currentResult: null,
  addResult: (result) => set((state) => ({
    recentResults: [result, ...state.recentResults.slice(0, 9)], // 只保留最近10个结果
  })),
  setCurrentResult: (result) => set({ currentResult: result }),
  clearResults: () => set({ recentResults: [], currentResult: null }),
}));