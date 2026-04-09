'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@/src/store/useAuthStore';
import './home.css';

export default function Home() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleGetStarted = () => {
    router.push('/login');
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
              <button 
                onClick={handleGetStarted}
                className="home-nav-link-primary"
              >
                立即使用
              </button>
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
          
          <div className="home-hero-buttons">
            <button 
              onClick={handleGetStarted}
              className="home-hero-btn-primary"
            >
              开始使用
            </button>
            <button className="home-hero-btn-secondary">
              了解更多
            </button>
          </div>

          {/* 功能特性 */}
          <div className="home-features">
            <div className="home-feature-card">
              <div className="home-feature-icon">🔍</div>
              <h3 className="home-feature-title">风险预测</h3>
              <p className="home-feature-desc">智能检测企业合规风险与支付风险</p>
            </div>
            <div className="home-feature-card">
              <div className="home-feature-icon">📊</div>
              <h3 className="home-feature-title">数据可视化</h3>
              <p className="home-feature-desc">多维度风险分析与趋势图表展示</p>
            </div>
            <div className="home-feature-card">
              <div className="home-feature-icon">🌐</div>
              <h3 className="home-feature-title">关系图谱</h3>
              <p className="home-feature-desc">企业、物流商、海关关系网络分析</p>
            </div>
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
