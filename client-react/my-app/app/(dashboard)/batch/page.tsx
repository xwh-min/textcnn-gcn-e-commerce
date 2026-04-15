'use client';

import { useState } from 'react';
import { apiService } from '@/src/services/api';
import './styles.css';

interface EnterpriseItem {
  id: string;
  name: string;
  creditCode: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  complianceRisk?: { hasRisk: boolean; probability: number };
  paymentRisk?: { hasRisk: boolean; probability: number };
  errorMessage?: string;
}

const riskLevelLabels: Record<string, string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
  critical: '严重风险',
};

const riskLevelColors: Record<string, string> = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
  critical: '#991b1b',
};

const normalizePercent = (v: unknown) => {
  if (typeof v !== 'number' || Number.isNaN(v)) return 0;
  return v <= 1 ? Math.round(v * 100) : Math.max(0, Math.min(100, Math.round(v)));
};

export default function BatchPage() {
  const [step, setStep] = useState(1);
  const [enterprises, setEnterprises] = useState<EnterpriseItem[]>([]);
  const [progress, setProgress] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  const handleDownloadTemplate = () => {
    const csvContent = '企业名称,统一社会信用代码\n示例企业A,91110000MA12345678\n示例企业B,91110000MA87654321';
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '企业批量预测模板.csv';
    link.click();
  };

  const parseCsv = (content: string): EnterpriseItem[] => {
    const lines = content.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length < 2) return [];

    const items: EnterpriseItem[] = [];
    for (let i = 1; i < lines.length; i++) {
      const columns = lines[i].split(',').map((col) => col.trim());
      if (columns.length >= 2 && columns[0] && columns[1]) {
        items.push({
          id: `${Date.now()}-${i}`,
          name: columns[0],
          creditCode: columns[1],
          status: 'pending',
        });
      }
    }
    return items;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = (event.target?.result as string) || '';
      const items = parseCsv(content);

      if (items.length === 0) {
        alert('文件格式不正确，请使用模板并确保有有效数据');
        return;
      }

      setEnterprises(items);
      setStep(2);
    };
    reader.readAsText(file);
  };

  const handleStartBatch = async () => {
    const queue = enterprises.map((e) => ({ ...e, status: 'pending' as const }));
    setEnterprises(queue);
    setStep(3);
    setProgress(0);
    setSuccessCount(0);
    setFailedCount(0);

    let success = 0;
    let failed = 0;

    for (let i = 0; i < queue.length; i++) {
      queue[i].status = 'processing';
      setEnterprises([...queue]);

      try {
        const response = await apiService.predictRisk({
          company_name: queue[i].name,
          recent_data: {
            text: '最近3个月',
          },
        });

        const payload = response.data;
        if (response.code === 200 && payload) {
          const complianceScore = payload.scores?.compliance_score ?? payload.compliance_score ?? 0;
          const paymentScore = payload.scores?.payment_score ?? payload.payment_score ?? 0;
          const riskLevel = (payload.compliance_risk || payload.payment_risk || 'low').toLowerCase();

          queue[i] = {
            ...queue[i],
            status: 'success',
            riskLevel: (['low', 'medium', 'high', 'critical'].includes(riskLevel) ? riskLevel : 'low') as EnterpriseItem['riskLevel'],
            complianceRisk: {
              hasRisk: (payload.compliance_risk || 'low') !== 'low',
              probability: normalizePercent(complianceScore),
            },
            paymentRisk: {
              hasRisk: (payload.payment_risk || 'low') !== 'low',
              probability: normalizePercent(paymentScore),
            },
          };
          success += 1;
        } else {
          queue[i] = {
            ...queue[i],
            status: 'failed',
            errorMessage: response.message || '预测失败',
          };
          failed += 1;
        }
      } catch {
        queue[i] = {
          ...queue[i],
          status: 'failed',
          errorMessage: '网络异常，请稍后重试',
        };
        failed += 1;
      }

      setSuccessCount(success);
      setFailedCount(failed);
      setProgress(Math.round(((i + 1) / queue.length) * 100));
      setEnterprises([...queue]);
    }

    setStep(4);
  };

  const handleViewFailReason = (item: EnterpriseItem) => {
    alert(`企业：${item.name}\n失败原因：${item.errorMessage || '未知原因'}`);
  };

  const handleExportAll = () => {
    const successRows = enterprises
      .filter((e) => e.status === 'success')
      .map(
        (e) => `${e.name},${e.creditCode},${riskLevelLabels[e.riskLevel || 'low']},${e.complianceRisk?.probability || 0}%,${e.paymentRisk?.probability || 0}%`
      );

    const csv = ['企业名称,统一社会信用代码,风险等级,合规风险概率,支付风险概率', ...successRows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '批量风险预测结果.csv';
    link.click();
  };

  const handleReset = () => {
    setStep(1);
    setEnterprises([]);
    setProgress(0);
    setSuccessCount(0);
    setFailedCount(0);
  };

  return (
    <div className="batch-page">
      <div className="batch-container">
        <div className="batch-header">
          <div className="batch-header-left">
            <h1 className="batch-title">批量风险预测</h1>
            <p className="batch-subtitle">模板下载、上传校验、批量执行与结果导出</p>
          </div>
          {step > 1 && (
            <button className="reset-btn" onClick={handleReset}>
              重新开始
            </button>
          )}
        </div>

        <div className="batch-steps">
          <div className={`step-item ${step >= 1 ? 'active' : ''}`}><div className="step-number">1</div><div className="step-label">上传文件</div></div>
          <div className={`step-line ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`step-item ${step >= 2 ? 'active' : ''}`}><div className="step-number">2</div><div className="step-label">确认清单</div></div>
          <div className={`step-line ${step >= 3 ? 'active' : ''}`}></div>
          <div className={`step-item ${step >= 3 ? 'active' : ''}`}><div className="step-number">3</div><div className="step-label">执行预测</div></div>
          <div className={`step-line ${step >= 4 ? 'active' : ''}`}></div>
          <div className={`step-item ${step >= 4 ? 'active' : ''}`}><div className="step-number">4</div><div className="step-label">查看结果</div></div>
        </div>

        {step === 1 && (
          <div className="batch-card">
            <div className="upload-section">
              <div className="upload-title">上传企业列表文件</div>
              <div className="upload-actions">
                <button className="download-btn" onClick={handleDownloadTemplate}>下载Excel模板</button>
                <label className="upload-btn">
                  选择文件上传
                  <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
              </div>
            </div>
          </div>
        )}

        {(step === 2 || step === 3 || step === 4) && (
          <div className="batch-card">
            {step >= 3 && (
              <div className="progress-stats" style={{ marginBottom: 16 }}>
                <div className="stat-item"><div className="stat-label">总进度</div><div className="stat-value">{progress}%</div></div>
                <div className="stat-item success"><div className="stat-label">成功</div><div className="stat-value">{successCount}</div></div>
                <div className="stat-item failed"><div className="stat-label">失败</div><div className="stat-value">{failedCount}</div></div>
              </div>
            )}

            {step >= 3 && (
              <div className="progress-bar-wrapper" style={{ marginBottom: 16 }}>
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }}></div></div>
              </div>
            )}

            <div className="table-container">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>序号</th><th>企业名称</th><th>统一社会信用代码</th><th>风险等级</th><th>状态</th><th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {enterprises.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td>{item.name}</td>
                      <td>{item.creditCode}</td>
                      <td>
                        {item.riskLevel && (
                          <span className="risk-badge" style={{ backgroundColor: `${riskLevelColors[item.riskLevel]}20`, color: riskLevelColors[item.riskLevel] }}>
                            {riskLevelLabels[item.riskLevel]}
                          </span>
                        )}
                      </td>
                      <td>
                        {item.status === 'pending' && <span className="status-badge pending">待预测</span>}
                        {item.status === 'processing' && <span className="status-badge processing">预测中</span>}
                        {item.status === 'success' && <span className="status-badge success">成功</span>}
                        {item.status === 'failed' && <span className="status-badge failed">失败</span>}
                      </td>
                      <td>
                        {item.status === 'failed' && (
                          <button className="view-fail-btn" onClick={() => handleViewFailReason(item)}>
                            查看失败原因
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="batch-actions">
              {step === 2 && (
                <>
                  <button className="btn-secondary" onClick={() => setStep(1)}>返回修改</button>
                  <button className="btn-primary" onClick={handleStartBatch}>开始批量预测</button>
                </>
              )}
              {step === 4 && (
                <button className="export-btn" onClick={handleExportAll}>导出全部报告</button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
