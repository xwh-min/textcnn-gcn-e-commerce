'use client';

import { useState, useEffect } from 'react';
import { apiService } from '@/src/services/api';
import '../dashboard/styles.css';

interface RiskTrendItem {
  month: string;
  total: number;
  high: number;
  medium: number;
}

interface RecentDetection {
  id: number;
  name: string;
  riskLevel: 'high' | 'medium' | 'low';
  riskLevelText: string;
  detectTime: string;
}

const mockTrendData: RiskTrendItem[] = [
  { month: '1月', total: 920, high: 22, medium: 118 },
  { month: '2月', total: 980, high: 25, medium: 125 },
  { month: '3月', total: 1050, high: 28, medium: 135 },
  { month: '4月', total: 1120, high: 30, medium: 145 },
  { month: '5月', total: 1200, high: 32, medium: 156 },
  { month: '6月', total: 1245, high: 35, medium: 168 },
];

const mockRecentDetections: RecentDetection[] = [
  { id: 1, name: '深圳前海跨境电子商务有限公司', riskLevel: 'high', riskLevelText: '高风险', detectTime: '2026-06-28 15:30' },
  { id: 2, name: '上海自贸区跨境电商服务有限公司', riskLevel: 'high', riskLevelText: '高风险', detectTime: '2026-06-28 14:15' },
  { id: 3, name: '重庆保税港区跨境电商有限公司', riskLevel: 'high', riskLevelText: '高风险', detectTime: '2026-06-28 13:45' },
  { id: 4, name: '广州南沙跨境电商产业园有限公司', riskLevel: 'medium', riskLevelText: '中风险', detectTime: '2026-06-28 12:30' },
  { id: 5, name: '成都跨境电子商务协会有限公司', riskLevel: 'medium', riskLevelText: '中风险', detectTime: '2026-06-28 11:15' },
];

export default function DashboardPage() {
  const [riskTrendData, setRiskTrendData] = useState<RiskTrendItem[]>(mockTrendData);
  const [recentDetections, setRecentDetections] = useState<RecentDetection[]>(mockRecentDetections);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [historyRes] = await Promise.all([
          apiService.getRiskHistory({ limit: 200 }),
        ]);

        if (historyRes.code === 200 && historyRes.data) {
          const historyItems = historyRes.data.items || historyRes.data;
          const monthlyData: Record<string, { total: number; high: number; medium: number }> = {};
          
          historyItems.forEach((item: any) => {
            const date = item.created_at || item.predictionDate || new Date().toISOString();
            const month = new Date(date).toLocaleDateString('zh-CN', { month: 'short' });
            if (!monthlyData[month]) {
              monthlyData[month] = { total: 0, high: 0, medium: 0 };
            }
            monthlyData[month].total += 1;
            const riskLevel = (item.risk_level || item.riskLevel || '').toLowerCase();
            if (riskLevel === 'high') monthlyData[month].high += 1;
            else if (riskLevel === 'medium') monthlyData[month].medium += 1;
          });

          const trendData: RiskTrendItem[] = Object.entries(monthlyData).map(([month, data]) => ({
            month,
            total: data.total,
            high: data.high,
            medium: data.medium,
          }));

          if (trendData.length > 0) {
            setRiskTrendData(trendData.slice(-6));
          }
        }
      } catch (err) {
        console.error('加载仪表盘数据失败:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const latestMonthData = riskTrendData.length > 0 ? riskTrendData[riskTrendData.length - 1] : { total: 1245, high: 35, medium: 168 };
  const previousMonthData = riskTrendData.length > 1 ? riskTrendData[riskTrendData.length - 2] : { total: 1200, high: 32, medium: 156 };
  
  const totalGrowth = previousMonthData.total > 0 
    ? Math.round(((latestMonthData.total - previousMonthData.total) / previousMonthData.total) * 100) 
    : 12;
  const highGrowth = previousMonthData.high > 0 
    ? Math.round(((latestMonthData.high - previousMonthData.high) / previousMonthData.high) * 100) 
    : 5;
  const mediumGrowth = previousMonthData.medium > 0 
    ? Math.round(((latestMonthData.medium - previousMonthData.medium) / previousMonthData.medium) * 100) 
    : 8;

  const maxValue = Math.max(
    ...riskTrendData.map(item => Math.max(item.high, item.medium, item.total - item.high - item.medium)),
    1
  );

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };
  
  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">数据展示</h1>
          <p className="dashboard-subtitle">系统概览和风险统计</p>
        </div>
        
        <div className="dashboard-stats-grid">
          <div className="dashboard-stat-card">
            <h3 className="dashboard-stat-title">总风险检测</h3>
            <p className="dashboard-stat-value indigo">{formatNumber(latestMonthData.total)}</p>
            <p className="dashboard-stat-change">较上月增长 {totalGrowth}%</p>
          </div>
          <div className="dashboard-stat-card">
            <h3 className="dashboard-stat-title">高风险企业</h3>
            <p className="dashboard-stat-value red">{latestMonthData.high}</p>
            <p className="dashboard-stat-change">较上月增长 {highGrowth}%</p>
          </div>
          <div className="dashboard-stat-card">
            <h3 className="dashboard-stat-title">中风险企业</h3>
            <p className="dashboard-stat-value yellow">{latestMonthData.medium}</p>
            <p className="dashboard-stat-change">较上月增长 {mediumGrowth}%</p>
          </div>
        </div>
        
        <div className="dashboard-chart-card">
          <h3 className="dashboard-chart-title">风险趋势</h3>
          <div className="dashboard-chart-container">
            <div className="chart-content">
              <div className="chart-legend">
                <div className="legend-item">
                  <span className="legend-color high"></span>
                  <span className="legend-text">高风险企业</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color medium"></span>
                  <span className="legend-text">中风险企业</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color low"></span>
                  <span className="legend-text">低风险企业</span>
                </div>
              </div>
              <div className="chart-grid-grouped">
                {riskTrendData.map((item, index) => {
                  const lowCount = item.total - item.high - item.medium;
                  return (
                    <div key={index} className="chart-column-grouped">
                      <div className="chart-label-grouped">{item.month}</div>
                      <div className="chart-bars-grouped">
                        <div 
                          className="chart-bar-grouped high" 
                          style={{ height: `${(item.high / maxValue) * 100}%` }}
                        >
                          <span className="bar-tooltip">{item.high}</span>
                        </div>
                        <div 
                          className="chart-bar-grouped medium" 
                          style={{ height: `${(item.medium / maxValue) * 100}%` }}
                        >
                          <span className="bar-tooltip">{item.medium}</span>
                        </div>
                        <div 
                          className="chart-bar-grouped low" 
                          style={{ height: `${(lowCount / maxValue) * 100}%` }}
                        >
                          <span className="bar-tooltip">{lowCount}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        
        <div className="dashboard-table-card">
          <h3 className="dashboard-table-title">最近风险检测</h3>
          <div className="dashboard-table-container">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>企业名称</th>
                  <th>风险等级</th>
                  <th>检测时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {recentDetections.map((detection) => (
                  <tr key={detection.id}>
                    <td className="enterprise-name">{detection.name}</td>
                    <td className={`risk-${detection.riskLevel}`}>{detection.riskLevelText}</td>
                    <td>{detection.detectTime}</td>
                    <td>
                      <a href={`/enterprises/${detection.id}`} className="dashboard-link">查看详情</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
