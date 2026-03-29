'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import "./home.css";

interface RecentSearch {
  id: number;
  company: string;
  date: string;
  complianceRisk: string;
  paymentRisk: string;
  score: string;
}

export default function Home() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState('');
  const [dataMonths, setDataMonths] = useState('3');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([
    {
      id: 1,
      company: 'Example Company',
      date: '5 seconds ago',
      complianceRisk: 'Low',
      paymentRisk: 'Medium',
      score: '75'
    },
    {
      id: 2,
      company: 'Test Corporation',
      date: '2 minutes ago',
      complianceRisk: 'High',
      paymentRisk: 'Low',
      score: '45'
    }
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;
    
    // 跳转到detection页面，传递企业名称和数据周期
    router.push(`/detection?company=${encodeURIComponent(companyName)}&months=${dataMonths}`);
  };

  return (
    <div className="home-page">
      {/* 导航栏 */}
      <nav className="home-nav">
        <div className="home-nav-container">
          <div className="home-nav-content">
            <div className="home-nav-brand">
              <span className="home-nav-logo">🚀</span>
              <span>跨境风控</span>
            </div>
            <div className="home-nav-links">
              <a href="/login" className="home-nav-link-secondary">登录</a>
              <button className="home-nav-link-primary">设置</button>
            </div>
          </div>
        </div>
      </nav>

      {/* 英雄区域 */}
      <section className="home-hero">
        <div className="home-hero-content">
          <h1 className="home-hero-title">
            跨境电商风险检测
          </h1>
          <p className="home-hero-description">
            融合TextCNN与GCN构建轻量型模型，实现跨境电商企业的合规风险和支付风险预测
          </p>
          
          {/* 检测表单 */}
          <form onSubmit={handleSubmit} className="home-detection-form">
            <div className="home-form-group">
              <input
                type="text"
                placeholder="输入企业名称"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="home-form-input"
                required
              />
              <button type="submit" className="home-form-button">
                检测
              </button>
            </div>
            <div className="home-form-options">
              <label className="home-checkbox-label">
                <input
                  type="checkbox"
                  checked={showAdvanced}
                  onChange={() => setShowAdvanced(!showAdvanced)}
                />
                显示高级选项
              </label>
            </div>
            {showAdvanced && (
              <div className="home-advanced-options">
                <div className="home-form-group">
                  <label>数据时间范围：</label>
                  <select
                    value={dataMonths}
                    onChange={(e) => setDataMonths(e.target.value)}
                    className="home-form-select"
                  >
                    <option value="1">1个月</option>
                    <option value="3">3个月</option>
                    <option value="6">6个月</option>
                    <option value="12">12个月</option>
                  </select>
                </div>
              </div>
            )}
          </form>
        </div>
      </section>

      {/* 最近检测 */}
      <section className="home-recent">
        <div className="home-recent-container">
          <h2 className="home-recent-title">最近检测</h2>
          <div className="home-recent-search">
            <input type="text" placeholder="搜索..." className="home-recent-input" />
          </div>
          <div className="home-recent-table">
            <table>
              <thead>
                <tr>
                  <th>企业名称</th>
                  <th>检测时间</th>
                  <th>合规风险</th>
                  <th>支付风险</th>
                  <th>风险评分</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {recentSearches.map((search) => (
                  <tr key={search.id}>
                    <td>{search.company}</td>
                    <td>{search.date}</td>
                    <td>
                      <span className={`home-risk-badge home-risk-${search.complianceRisk.toLowerCase()}`}>
                        {search.complianceRisk}
                      </span>
                    </td>
                    <td>
                      <span className={`home-risk-badge home-risk-${search.paymentRisk.toLowerCase()}`}>
                        {search.paymentRisk}
                      </span>
                    </td>
                    <td>{search.score}</td>
                    <td>
                      <div className="home-recent-actions">
                        <button className="home-action-btn">查看</button>
                        <button className="home-action-btn">分享</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="home-recent-pagination">
            <button className="home-pagination-btn">上一页</button>
            <button className="home-pagination-btn active">1</button>
            <button className="home-pagination-btn">2</button>
            <button className="home-pagination-btn">3</button>
            <button className="home-pagination-btn">下一页</button>
          </div>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="home-footer">
        <div className="home-footer-container">
          <p className="home-footer-text">
            Powered by 跨境风控 | <a href="#">使用条款</a> | <a href="#">隐私政策</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
