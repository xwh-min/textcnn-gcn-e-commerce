'use client';

import Sidebar from '@/components/common/Sidebar';
import Header from '@/components/common/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-main">
        <Header />
        <main className="dashboard-content">
          {children}
        </main>
      </div>

      <style jsx>{`
        .dashboard-layout {
          display: flex;
          min-height: 100vh;
        }

        .dashboard-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .dashboard-content {
          flex: 1;
          background: #f9fafb;
          overflow-y: auto;
        }
      `}</style>
    </div>
  );
}
