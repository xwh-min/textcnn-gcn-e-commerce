import '../dashboard/styles.css';

export default function DashboardPage() {
  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">仪表盘</h1>
          <p className="dashboard-subtitle">系统概览和风险统计</p>
        </div>
        
        <div className="dashboard-stats-grid">
          <div className="dashboard-stat-card">
            <h3 className="dashboard-stat-title">总风险检测</h3>
            <p className="dashboard-stat-value indigo">1,245</p>
            <p className="dashboard-stat-change">较上月增长 12%</p>
          </div>
          <div className="dashboard-stat-card">
            <h3 className="dashboard-stat-title">高风险企业</h3>
            <p className="dashboard-stat-value red">32</p>
            <p className="dashboard-stat-change">较上月增长 5%</p>
          </div>
          <div className="dashboard-stat-card">
            <h3 className="dashboard-stat-title">中风险企业</h3>
            <p className="dashboard-stat-value yellow">156</p>
            <p className="dashboard-stat-change">较上月增长 8%</p>
          </div>
        </div>
        
        <div className="dashboard-chart-card">
          <h3 className="dashboard-chart-title">风险趋势</h3>
          <div className="dashboard-chart-placeholder">
            <p>风险趋势图表</p>
          </div>
        </div>
        
        <div className="dashboard-table-card">
          <h3 className="dashboard-table-title">最近风险检测</h3>
          <div className="dashboard-table-container">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>企业名称</th>
                  <th>风险等级</th>
                  <th>检测时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="enterprise-name">示例企业 A</td>
                  <td className="risk-high">高风险</td>
                  <td>2026-03-17 10:30</td>
                  <td>
                    <a href="#" className="dashboard-link">查看详情</a>
                  </td>
                </tr>
                <tr>
                  <td className="enterprise-name">示例企业 B</td>
                  <td className="risk-medium">中风险</td>
                  <td>2026-03-17 09:15</td>
                  <td>
                    <a href="#" className="dashboard-link">查看详情</a>
                  </td>
                </tr>
                <tr>
                  <td className="enterprise-name">示例企业 C</td>
                  <td className="risk-low">低风险</td>
                  <td>2026-03-16 16:45</td>
                  <td>
                    <a href="#" className="dashboard-link">查看详情</a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
