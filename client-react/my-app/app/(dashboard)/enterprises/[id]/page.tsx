'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import './styles.css';

interface Relation {
  id: string;
  name: string;
  type: 'enterprise' | 'logistics' | 'customs';
  relationType: string;
}

interface RiskRecord {
  id: string;
  date: string;
  riskLevel: 'high' | 'medium' | 'low';
  riskType: string;
  description: string;
}

const mockEnterpriseDetail = {
  id: '1',
  name: '示例企业 A',
  creditCode: '91110000MA12345678',
  type: 'enterprise' as const,
  riskStatus: 'high' as const,
  registerDate: '2020-01-01',
  lastDetectionDate: '2026-03-17 10:30',
  address: '北京市朝阳区xxx大厦xxx号',
  legalRepresentative: '张三',
  registeredCapital: '1000万元',
  businessScope: '跨境电商、进出口贸易、供应链管理',
};

const mockRelations: Relation[] = [
  {
    id: '2',
    name: '示例物流商 B',
    type: 'logistics',
    relationType: '物流合作',
  },
  {
    id: '3',
    name: '示例海关 C',
    type: 'customs',
    relationType: '报关关系',
  },
  {
    id: '6',
    name: '关联企业 F',
    type: 'enterprise',
    relationType: '投资关系',
  },
];

const mockRiskRecords: RiskRecord[] = [
  {
    id: 'r1',
    date: '2026-03-17 10:30',
    riskLevel: 'high',
    riskType: '合规风险',
    description: '存在疑似虚假报关记录，建议进一步核查',
  },
  {
    id: 'r2',
    date: '2026-03-10 14:20',
    riskLevel: 'medium',
    riskType: '支付风险',
    description: '支付异常波动，存在资金风险隐患',
  },
  {
    id: 'r3',
    date: '2026-02-28 09:15',
    riskLevel: 'low',
    riskType: '物流风险',
    description: '物流时效略有延迟，需持续关注',
  },
];

const typeLabels: Record<string, string> = {
  enterprise: '企业',
  logistics: '物流商',
  customs: '海关',
};

const riskStatusLabels: Record<string, string> = {
  high: '高风险',
  medium: '中风险',
  low: '低风险',
  normal: '正常',
};

const riskStatusClasses: Record<string, string> = {
  high: 'risk-high',
  medium: 'risk-medium',
  low: 'risk-low',
  normal: 'risk-normal',
};

export default function EnterpriseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'info' | 'relations' | 'risks'>('info');

  return (
    <div className="enterprise-detail-page">
      <div className="enterprise-detail-container">
        {/* 页面头部 */}
        <div className="enterprise-detail-header">
          <div className="enterprise-detail-header-left">
            <Link href="/enterprises" className="enterprise-detail-back">
              ← 返回列表
            </Link>
            <div className="enterprise-detail-title">
              <h1>{mockEnterpriseDetail.name}</h1>
              <span className={`enterprise-detail-badge ${riskStatusClasses[mockEnterpriseDetail.riskStatus]}`}>
                {riskStatusLabels[mockEnterpriseDetail.riskStatus]}
              </span>
            </div>
          </div>
          <div className="enterprise-detail-actions">
            <button className="enterprise-detail-btn-secondary">编辑</button>
            <button className="enterprise-detail-btn-primary">风险检测</button>
          </div>
        </div>

        {/* 标签导航 */}
        <div className="enterprise-detail-tabs">
          <button
            className={`enterprise-detail-tab ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            基础信息
          </button>
          <button
            className={`enterprise-detail-tab ${activeTab === 'relations' ? 'active' : ''}`}
            onClick={() => setActiveTab('relations')}
          >
            关联关系
          </button>
          <button
            className={`enterprise-detail-tab ${activeTab === 'risks' ? 'active' : ''}`}
            onClick={() => setActiveTab('risks')}
          >
            风险记录
          </button>
        </div>

        {/* 内容区域 */}
        <div className="enterprise-detail-content">
          {activeTab === 'info' && (
            <div className="enterprise-info-section">
              <div className="enterprise-info-card">
                <h3 className="enterprise-info-card-title">基本信息</h3>
                <div className="enterprise-info-grid">
                  <div className="enterprise-info-item">
                    <label className="enterprise-info-label">统一社会信用代码</label>
                    <span className="enterprise-info-value">{mockEnterpriseDetail.creditCode}</span>
                  </div>
                  <div className="enterprise-info-item">
                    <label className="enterprise-info-label">主体类型</label>
                    <span className="enterprise-info-value">{typeLabels[mockEnterpriseDetail.type]}</span>
                  </div>
                  <div className="enterprise-info-item">
                    <label className="enterprise-info-label">注册时间</label>
                    <span className="enterprise-info-value">{mockEnterpriseDetail.registerDate}</span>
                  </div>
                  <div className="enterprise-info-item">
                    <label className="enterprise-info-label">最近检测时间</label>
                    <span className="enterprise-info-value">{mockEnterpriseDetail.lastDetectionDate}</span>
                  </div>
                  <div className="enterprise-info-item">
                    <label className="enterprise-info-label">法定代表人</label>
                    <span className="enterprise-info-value">{mockEnterpriseDetail.legalRepresentative}</span>
                  </div>
                  <div className="enterprise-info-item">
                    <label className="enterprise-info-label">注册资本</label>
                    <span className="enterprise-info-value">{mockEnterpriseDetail.registeredCapital}</span>
                  </div>
                  <div className="enterprise-info-item enterprise-info-item-full">
                    <label className="enterprise-info-label">注册地址</label>
                    <span className="enterprise-info-value">{mockEnterpriseDetail.address}</span>
                  </div>
                  <div className="enterprise-info-item enterprise-info-item-full">
                    <label className="enterprise-info-label">经营范围</label>
                    <span className="enterprise-info-value">{mockEnterpriseDetail.businessScope}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'relations' && (
            <div className="enterprise-relations-section">
              <div className="enterprise-relations-card">
                <h3 className="enterprise-info-card-title">关联主体（{mockRelations.length}）</h3>
                <div className="enterprise-relations-list">
                  {mockRelations.map((item) => (
                    <div key={item.id} className="enterprise-relation-item">
                      <div className="enterprise-relation-icon">
                        {item.type === 'enterprise' ? '🏢' : item.type === 'logistics' ? '🚚' : '🏛️'}
                      </div>
                      <div className="enterprise-relation-info">
                        <div className="enterprise-relation-name">
                          <Link href={`/enterprises/${item.id}`}>{item.name}</Link>
                        </div>
                        <div className="enterprise-relation-type">
                          <span className="enterprise-relation-badge">{typeLabels[item.type]}</span>
                          <span className="enterprise-relation-tag">{item.relationType}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'risks' && (
            <div className="enterprise-risks-section">
              <div className="enterprise-risks-card">
                <h3 className="enterprise-info-card-title">风险记录（{mockRiskRecords.length}）</h3>
                <div className="enterprise-risks-list">
                  {mockRiskRecords.map((item) => (
                    <div key={item.id} className="enterprise-risk-item">
                      <div className="enterprise-risk-header">
                        <span className={`enterprise-risk-level ${riskStatusClasses[item.riskLevel]}`}>
                          {riskStatusLabels[item.riskLevel]}
                        </span>
                        <span className="enterprise-risk-date">{item.date}</span>
                      </div>
                      <div className="enterprise-risk-type">{item.riskType}</div>
                      <div className="enterprise-risk-desc">{item.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
