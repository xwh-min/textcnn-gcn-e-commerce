'use client';

import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="home-nav">
      <div className="home-nav-container">
        <div className="home-nav-content">
          <div className="home-nav-brand">
            <span className="home-nav-logo">🚀</span>
            <span>跨境风控</span>
          </div>
          <div className="home-nav-links">
            <Link href="/login" className="home-nav-link-secondary">登录</Link>
            <button className="home-nav-link-primary">设置</button>
          </div>
        </div>
      </div>
    </nav>
  );
}