'use client';

import { useState } from 'react';
import Link from 'next/link';
import './styles.css';

const dataTypes = [
  { id: 'news', label: '政策新闻', icon: '📰', desc: '监管政策、行业新闻管理' },
  { id: 'complaints', label: '用户投诉', icon: '📋', desc: '用户投诉记录处理' },
  { id: 'orders', label: '订单数据', icon: '📦', desc: '跨境电商订单数据' },
  { id: 'logistics', label: '物流数据', icon: '🚚', desc: '物流运输数据管理' },
];

export default function DataCenterPage() {
  return (
    <div className="datacenter-page">
      <div className="datacenter-container">
        <div className="datacenter-header">
          <h1 className="datacenter-title">数据中心</h1>
          <p className="datacenter-subtitle">
            政策新闻、用户投诉、订单、物流数据统一管理平台
          </p>
        </div>

        <div className="datacenter-grid">
          {dataTypes.map((item) => (
            <Link 
              key={item.id} 
              href={`/datacenter/${item.id}`}
              className="datacenter-card"
            >
              <div className="datacenter-card-icon">
                {item.icon}
              </div>
              <h3 className="datacenter-card-title">{item.label}</h3>
              <p className="datacenter-card-desc">{item.desc}</p>
              <div className="datacenter-card-action">
                进入管理 →
              </div>
            </Link>
          ))}
        </div>

        {/* 快捷统计 */}
        <div className="datacenter-stats">
          <h2 className="datacenter-stats-title">数据概览</h2>
          <div className="datacenter-stats-grid">
            <div className="datacenter-stat-card">
              <div className="datacenter-stat-icon news">📰</div>
              <div className="datacenter-stat-info">
                <div className="datacenter-stat-value">156</div>
                <div className="datacenter-stat-label">政策新闻</div>
              </div>
            </div>
            <div className="datacenter-stat-card">
              <div className="datacenter-stat-icon complaints">📋</div>
              <div className="datacenter-stat-info">
                <div className="datacenter-stat-value">42</div>
                <div className="datacenter-stat-label">用户投诉</div>
              </div>
            </div>
            <div className="datacenter-stat-card">
              <div className="datacenter-stat-icon orders">📦</div>
              <div className="datacenter-stat-info">
                <div className="datacenter-stat-value">3,284</div>
                <div className="datacenter-stat-label">订单数据</div>
              </div>
            </div>
            <div className="datacenter-stat-card">
              <div className="datacenter-stat-icon logistics">🚚</div>
              <div className="datacenter-stat-info">
                <div className="datacenter-stat-value">2,891</div>
                <div className="datacenter-stat-label">物流数据</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
