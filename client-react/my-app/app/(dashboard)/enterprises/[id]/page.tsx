'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiService } from '@/src/services/api';
import './styles.css';

type EntityType = 'enterprise' | 'logistics' | 'customs';

interface DetailData {
  id: string;
  name: string;
  creditCode: string;
  type: EntityType;
  riskStatus: 'high' | 'medium' | 'low' | 'normal';
  registerDate: string;
  lastDetectionDate: string;
  address?: string;
  legalRepresentative?: string;
  businessScope?: string;
}

interface Relation {
  id: string;
  name: string;
  type: EntityType;
  relationType: string;
}

interface RiskRecord {
  id: string;
  date: string;
  riskLevel: 'high' | 'medium' | 'low';
  riskType: string;
  description: string;
}

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

const toDateText = (v: unknown) => {
  if (!v) return '-';
  return String(v).replace('T', ' ').slice(0, 19);
};

export default function EnterpriseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'info' | 'relations' | 'risks'>('info');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<DetailData | null>(null);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [riskRecords, setRiskRecords] = useState<RiskRecord[]>([]);

  const id = useMemo(() => {
    const raw = params?.id;
    if (Array.isArray(raw)) return raw[0];
    return raw ? String(raw) : '';
  }, [params]);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);

      try {
        let data: DetailData | null = null;

        const companyResp = await apiService.getCompany(Number(id));
        if (companyResp.code === 200 && companyResp.data) {
          const d: any = companyResp.data;
          data = {
            id: String(d.id),
            name: d.company_name || d.name || '-',
            creditCode: d.credit_code || '-',
            type: 'enterprise',
            riskStatus: d.is_high_risk ? 'high' : 'normal',
            registerDate: toDateText(d.established_date),
            lastDetectionDate: '-',
            address: d.registered_address || '-',
            legalRepresentative: d.legal_representative || '-',
            businessScope: d.business_scope || '-',
          };
        }

        if (!data) {
          const logisticsResp = await apiService.getLogisticsById(Number(id));
          if (logisticsResp.code === 200 && logisticsResp.data) {
            const d: any = logisticsResp.data;
            data = {
              id: String(d.id),
              name: d.provider_name || '-',
              creditCode: d.business_license_no || '-',
              type: 'logistics',
              riskStatus: d.is_high_risk ? 'high' : 'normal',
              registerDate: toDateText(d.created_at),
              lastDetectionDate: '-',
              businessScope: d.service_type || '-',
              address: Array.isArray(d.coverage_countries) ? d.coverage_countries.join('、') : '-',
            };
          }
        }

        if (!data) {
          const customsResp = await apiService.getCustomsById(Number(id));
          if (customsResp.code === 200 && customsResp.data) {
            const d: any = customsResp.data;
            data = {
              id: String(d.id),
              name: d.customs_name || '-',
              creditCode: d.customs_code || '-',
              type: 'customs',
              riskStatus: 'normal',
              registerDate: toDateText(d.created_at),
              lastDetectionDate: '-',
              address: d.region || '-',
              businessScope: d.supervision_level || '-',
            };
          }
        }

        if (!data) {
          setError('未找到该主体信息');
          setLoading(false);
          return;
        }

        setDetail(data);

        if (data.type === 'enterprise') {
          const [graphResp, historyResp] = await Promise.all([
            apiService.getCompanyGraph(Number(id)),
            apiService.getRiskHistory({ company_name: data.name, limit: 20 }),
          ]);

          const rels: Relation[] = [];
          const graphData: any = graphResp.data;
          const nodes = Array.isArray(graphData?.nodes) ? graphData.nodes : [];
          nodes.forEach((n: any) => {
            if (!n || String(n.id) === id) return;
            rels.push({
              id: String(n.id),
              name: n.name || n.label || `主体${n.id}`,
              type: n.type === 'logistics' || n.type === 'customs' ? n.type : 'enterprise',
              relationType: n.relation_type || '关联关系',
            });
          });
          setRelations(rels);

          const records: RiskRecord[] = [];
          const historyItems = Array.isArray(historyResp.data?.items) ? historyResp.data.items : [];
          historyItems.forEach((it: any, idx: number) => {
            const level = (it.compliance_risk || it.payment_risk || 'low').toLowerCase();
            records.push({
              id: String(it.id || idx),
              date: toDateText(it.created_at),
              riskLevel: level === 'high' || level === 'medium' ? level : 'low',
              riskType: '综合风险',
              description: `合规风险：${it.compliance_risk || 'low'}，支付风险：${it.payment_risk || 'low'}`,
            });
          });
          setRiskRecords(records);
        } else {
          setRelations([]);
          setRiskRecords([]);
        }
      } catch (e) {
        console.error(e);
        setError('加载详情失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  if (loading) {
    return <div className="enterprise-detail-page"><div className="enterprise-detail-container">加载中...</div></div>;
  }

  if (error || !detail) {
    return (
      <div className="enterprise-detail-page">
        <div className="enterprise-detail-container">
          <div style={{ marginBottom: 16 }}>{error || '加载失败'}</div>
          <Link href="/enterprises" className="enterprise-detail-back">← 返回列表</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="enterprise-detail-page">
      <div className="enterprise-detail-container">
        <div className="enterprise-detail-header">
          <div className="enterprise-detail-header-left">
            <Link href="/enterprises" className="enterprise-detail-back">← 返回列表</Link>
            <div className="enterprise-detail-title">
              <h1>{detail.name}</h1>
              <span className={`enterprise-detail-badge ${riskStatusClasses[detail.riskStatus]}`}>
                {riskStatusLabels[detail.riskStatus]}
              </span>
            </div>
          </div>
          <div className="enterprise-detail-actions">
            <button className="enterprise-detail-btn-secondary" onClick={() => router.push('/enterprises')}>返回管理</button>
            <button className="enterprise-detail-btn-primary" onClick={() => router.push('/detection')}>风险检测</button>
          </div>
        </div>

        <div className="enterprise-detail-tabs">
          <button className={`enterprise-detail-tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>基础信息</button>
          <button className={`enterprise-detail-tab ${activeTab === 'relations' ? 'active' : ''}`} onClick={() => setActiveTab('relations')}>关联关系</button>
          <button className={`enterprise-detail-tab ${activeTab === 'risks' ? 'active' : ''}`} onClick={() => setActiveTab('risks')}>风险记录</button>
        </div>

        <div className="enterprise-detail-content">
          {activeTab === 'info' && (
            <div className="enterprise-info-section">
              <div className="enterprise-info-card">
                <h3 className="enterprise-info-card-title">基本信息</h3>
                <div className="enterprise-info-grid">
                  <div className="enterprise-info-item"><label className="enterprise-info-label">统一社会信用代码</label><span className="enterprise-info-value">{detail.creditCode}</span></div>
                  <div className="enterprise-info-item"><label className="enterprise-info-label">主体类型</label><span className="enterprise-info-value">{typeLabels[detail.type]}</span></div>
                  <div className="enterprise-info-item"><label className="enterprise-info-label">注册时间</label><span className="enterprise-info-value">{detail.registerDate}</span></div>
                  <div className="enterprise-info-item"><label className="enterprise-info-label">最近检测时间</label><span className="enterprise-info-value">{detail.lastDetectionDate}</span></div>
                  <div className="enterprise-info-item"><label className="enterprise-info-label">法定代表人</label><span className="enterprise-info-value">{detail.legalRepresentative || '-'}</span></div>
                  <div className="enterprise-info-item enterprise-info-item-full"><label className="enterprise-info-label">注册地址/区域</label><span className="enterprise-info-value">{detail.address || '-'}</span></div>
                  <div className="enterprise-info-item enterprise-info-item-full"><label className="enterprise-info-label">经营范围/类型</label><span className="enterprise-info-value">{detail.businessScope || '-'}</span></div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'relations' && (
            <div className="enterprise-relations-section">
              <div className="enterprise-relations-card">
                <h3 className="enterprise-info-card-title">关联主体（{relations.length}）</h3>
                <div className="enterprise-relations-list">
                  {relations.length === 0 && <div>暂无关联数据</div>}
                  {relations.map((item) => (
                    <div key={item.id} className="enterprise-relation-item">
                      <div className="enterprise-relation-info">
                        <div className="enterprise-relation-name"><Link href={`/enterprises/${item.id}`}>{item.name}</Link></div>
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
                <h3 className="enterprise-info-card-title">风险记录（{riskRecords.length}）</h3>
                <div className="enterprise-risks-list">
                  {riskRecords.length === 0 && <div>暂无风险记录</div>}
                  {riskRecords.map((item) => (
                    <div key={item.id} className="enterprise-risk-item">
                      <div className="enterprise-risk-header">
                        <span className={`enterprise-risk-level ${riskStatusClasses[item.riskLevel]}`}>{riskStatusLabels[item.riskLevel]}</span>
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
