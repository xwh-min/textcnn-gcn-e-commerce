'use client';

interface RiskDetails {
  policyNews: string;
  userComplaints: string;
  logisticsPartners: string;
  customsRecords: string;
}

interface RiskResultProps {
  company: string;
  complianceRisk: string;
  paymentRisk: string;
  score: number;
  details: RiskDetails;
}

export default function RiskResult({ company, complianceRisk, paymentRisk, score, details }: RiskResultProps) {
  return (
    <section className="home-results">
      <div className="home-results-container">
        <h2 className="home-results-title">检测结果</h2>
        <div className="home-result-card">
          <div className="home-result-header">
            <h3>{company}</h3>
            <div className="home-result-score">
              风险评分: {score}/100
            </div>
          </div>
          <div className="home-result-details">
            <div className="home-risk-item">
              <span className="home-risk-label">合规风险:</span>
              <span className={`home-risk-value home-risk-${complianceRisk.toLowerCase()}`}>
                {complianceRisk}
              </span>
            </div>
            <div className="home-risk-item">
              <span className="home-risk-label">支付风险:</span>
              <span className={`home-risk-value home-risk-${paymentRisk.toLowerCase()}`}>
                {paymentRisk}
              </span>
            </div>
          </div>
          <div className="home-result-info">
            <h4>详细信息</h4>
            <ul>
              <li>政策新闻: {details.policyNews}</li>
              <li>用户投诉: {details.userComplaints}</li>
              <li>物流伙伴: {details.logisticsPartners}</li>
              <li>海关记录: {details.customsRecords}</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}