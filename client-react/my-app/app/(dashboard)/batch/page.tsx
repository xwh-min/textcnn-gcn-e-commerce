'use client';

import { useState } from 'react';
import { apiService } from '@/services/api';
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

export default function BatchPage() {
  const [step, setStep] = useState(1);
  const [enterprises, setEnterprises] = useState<EnterpriseItem[]>([]);
  const [progress, setProgress] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  const handleDownloadTemplate = () => {
    const csvContent = '企业名称,统一社会信用代码\n示例企业A,91110000MA12345678\n示例企业B,91110000MA87654321\n示例企业C,91110000MA98765432';
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '企业批量预测模板.csv';
    link.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const lines = content.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        alert('文件格式不正确，请确保至少有标题行和一条数据');
        return;
      }

      const items: EnterpriseItem[] = [];
      for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].split(',').map(col => col.trim());
        if (columns.length >= 2) {
          items.push({
            id: Date.now() + '-' + i,
            name: columns[0],
            creditCode: columns[1],
            status: 'pending',
          });
        }
      }

      if (items.length > 0) {
        setEnterprises(items);
        setStep(2);
      } else {
        alert('未找到有效的企业数据');
      }
    };
    reader.readAsText(file);
  };

  const handleStartBatch = async () => {
    setStep(3);
    setProgress(0);
    setSuccessCount(0);
    setFailedCount(0);

    const updatedEnterprises = [...enterprises];
    setEnterprises(updatedEnterprises);

    try {
      // 准备企业列表数据
      const enterpriseList = enterprises.map(item => ({
        name: item.name,
        creditCode: item.creditCode,
      }));

      // 调用批量预测API
      const response = await apiService.batchRiskPrediction({
        enterprises: enterpriseList,
        timeRangeMonths: 3,
      });

      if (response.code === 200 && response.data) {
        // 处理API返回结果
        const results = response.data.results || response.data || [];
        
        results.forEach((result: any, index: number) => {
          if (index < updatedEnterprises.length) {
            if (result.success || result.status === 'success') {
              updatedEnterprises[index].status = 'success';
              updatedEnterprises[index].riskLevel = (result.riskLevel?.toLowerCase() as any) || 'low';
              updatedEnterprises[index].complianceRisk = {
                hasRisk: result.complianceRisk || result.hasComplianceRisk || false,
                probability: result.complianceProbability || result.complianceScore || 0,
              };
              updatedEnterprises[index].paymentRisk = {
                hasRisk: result.paymentRisk || result.hasPaymentRisk || false,
                probability: result.paymentProbability || result.paymentScore || 0,
              };
              setSuccessCount(prev => prev + 1);
            } else {
              updatedEnterprises[index].status = 'failed';
              updatedEnterprises[index].errorMessage = result.errorMessage || result.error || '预测失败';
              setFailedCount(prev => prev + 1);
            }
          }
        });

        setEnterprises([...updatedEnterprises]);
        setProgress(100);
      } else {
        // API调用失败，标记全部为失败
        updatedEnterprises.forEach((item, index) => {
          updatedEnterprises[index].status = 'failed';
          updatedEnterprises[index].errorMessage = response.message || '批量预测请求失败';
        });
        setEnterprises([...updatedEnterprises]);
        setFailedCount(updatedEnterprises.length);
        setProgress(100);
      }
    } catch (err) {
      console.error('批量预测失败:', err);
      // 网络错误，标记全部为失败
      updatedEnterprises.forEach((item, index) => {
        updatedEnterprises[index].status = 'failed';
        updatedEnterprises[index].errorMessage = '网络连接失败，请稍后重试';
      });
      setEnterprises([...updatedEnterprises]);
      setFailedCount(updatedEnterprises.length);
      setProgress(100);
    }

    setStep(4);
  };

  const handleViewFailReason = (item: EnterpriseItem) => {
    alert(`企业：${item.name}\n失败原因：${item.errorMessage}`);
  };

  const handleExportAll = () => {
    alert('导出全部报告功能开发中...');
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
            <p className="batch-subtitle">批量上传企业数据进行风险预测</p>
          </div>
          {step > 1 && (
            <button className="reset-btn" onClick={handleReset}>
              重新开始
            </button>
          )}
        </div>

        <div className="batch-steps">
          <div className={`step-item ${step >= 1 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">上传文件</div>
          </div>
          <div className={`step-line ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`step-item ${step >= 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">确认清单</div>
          </div>
          <div className={`step-line ${step >= 3 ? 'active' : ''}`}></div>
          <div className={`step-item ${step >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">执行预测</div>
          </div>
          <div className={`step-line ${step >= 4 ? 'active' : ''}`}></div>
          <div className={`step-item ${step >= 4 ? 'active' : ''}`}>
            <div className="step-number">4</div>
            <div className="step-label">查看结果</div>
          </div>
        </div>

        {step === 1 && (
          <div className="batch-card">
            <div className="upload-section">
              <div className="upload-icon">📁</div>
              <h3 className="upload-title">上传企业列表文件</h3>
              <p className="upload-desc">请先下载模板，填写企业信息后上传</p>
              
              <div className="upload-actions">
                <button className="download-btn" onClick={handleDownloadTemplate}>
                  <svg className="btn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  下载Excel模板
                </button>
                <label className="upload-btn">
                  <svg className="btn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  选择文件上传
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              <div className="upload-hint">
                <p>支持格式：CSV、XLSX、XLS</p>
                <p>文件大小：不超过10MB</p>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="batch-card">
            <div className="list-header">
              <h3 className="list-title">待预测企业清单</h3>
              <span className="list-count">共 {enterprises.length} 家企业</span>
            </div>

            <div className="table-container">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>序号</th>
                    <th>企业名称</th>
                    <th>统一社会信用代码</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {enterprises.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td>{item.name}</td>
                      <td>{item.creditCode}</td>
                      <td>
                        <span className="status-badge pending">待预测</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="batch-actions">
              <button className="btn-secondary" onClick={() => setStep(1)}>
                返回修改
              </button>
              <button className="btn-primary" onClick={handleStartBatch}>
                开始批量预测
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="batch-card">
            <div className="progress-section">
              <h3 className="progress-title">批量预测进行中...</h3>
              
              <div className="progress-stats">
                <div className="stat-item">
                  <div className="stat-label">总进度</div>
                  <div className="stat-value">{progress}%</div>
                </div>
                <div className="stat-item success">
                  <div className="stat-label">成功</div>
                  <div className="stat-value">{successCount}</div>
                </div>
                <div className="stat-item failed">
                  <div className="stat-label">失败</div>
                  <div className="stat-value">{failedCount}</div>
                </div>
              </div>

              <div className="progress-bar-wrapper">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                </div>
              </div>

              <div className="table-container">
                <table className="enterprise-table">
                  <thead>
                    <tr>
                      <th>序号</th>
                      <th>企业名称</th>
                      <th>统一社会信用代码</th>
                      <th>状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enterprises.map((item, index) => (
                      <tr key={item.id}>
                        <td>{index + 1}</td>
                        <td>{item.name}</td>
                        <td>{item.creditCode}</td>
                        <td>
                          {item.status === 'pending' && <span className="status-badge pending">待预测</span>}
                          {item.status === 'processing' && <span className="status-badge processing">预测中...</span>}
                          {item.status === 'success' && <span className="status-badge success">成功</span>}
                          {item.status === 'failed' && <span className="status-badge failed">失败</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="batch-card">
            <div className="result-header">
              <div className="result-header-left">
                <h3 className="result-title">预测结果</h3>
                <div className="result-summary">
                  <span className="summary-item success">成功：{successCount} 家</span>
                  <span className="summary-item failed">失败：{failedCount} 家</span>
                </div>
              </div>
              <button className="export-btn" onClick={handleExportAll}>
                <svg className="btn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                导出全部报告
              </button>
            </div>

            <div className="table-container">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>序号</th>
                    <th>企业名称</th>
                    <th>统一社会信用代码</th>
                    <th>风险等级</th>
                    <th>合规风险</th>
                    <th>支付风险</th>
                    <th>状态</th>
                    <th>操作</th>
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
                          <span 
                            className="risk-badge" 
                            style={{ backgroundColor: riskLevelColors[item.riskLevel] + '20', color: riskLevelColors[item.riskLevel] }}
                          >
                            {riskLevelLabels[item.riskLevel]}
                          </span>
                        )}
                      </td>
                      <td>
                        {item.complianceRisk && (
                          <span className={item.complianceRisk.hasRisk ? 'risk-indicator danger' : 'risk-indicator success'}>
                            {item.complianceRisk.hasRisk ? `有风险 (${item.complianceRisk.probability}%)` : '正常'}
                          </span>
                        )}
                      </td>
                      <td>
                        {item.paymentRisk && (
                          <span className={item.paymentRisk.hasRisk ? 'risk-indicator danger' : 'risk-indicator success'}>
                            {item.paymentRisk.hasRisk ? `有风险 (${item.paymentRisk.probability}%)` : '正常'}
                          </span>
                        )}
                      </td>
                      <td>
                        {item.status === 'success' && <span className="status-badge success">成功</span>}
                        {item.status === 'failed' && <span className="status-badge failed">失败</span>}
                      </td>
                      <td>
                        {item.status === 'failed' && (
                          <button 
                            className="view-fail-btn"
                            onClick={() => handleViewFailReason(item)}
                          >
                            查看原因
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
