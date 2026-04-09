import './styles.css';

export default function RisksPage() {
  return (
    <div className="risks-page">
      <div className="risks-container">
        <div className="risks-header">
          <h1 className="risks-title">风险列表</h1>
          <p className="risks-subtitle">历史风险记录管理</p>
        </div>
        
        <div className="risks-card">
          <div className="risks-filter-bar">
            <div className="risks-search-container">
              <svg className="risks-search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{ width: '1.25rem', height: '1.25rem' }}>
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              <input
                type="text"
                className="risks-search-input"
                placeholder="搜索企业名称"
              />
            </div>
            <div className="risks-filter-actions">
              <select className="risks-filter-select">
                <option value="all">所有风险等级</option>
                <option value="high">高风险</option>
                <option value="medium">中风险</option>
                <option value="low">低风险</option>
              </select>
              <button className="risks-filter-btn">筛选</button>
            </div>
          </div>
          
          <div className="risks-table-container">
            <table className="risks-table">
              <thead>
                <tr>
                  <th>企业名称</th>
                  <th>风险等级</th>
                  <th>检测时间</th>
                  <th>风险类型</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="enterprise-name">示例企业 A</td>
                  <td className="risk-high">高风险</td>
                  <td>2026-03-17 10:30</td>
                  <td>合规风险, 支付风险</td>
                  <td>
                    <span className="risks-badge risks-badge-red">待处理</span>
                  </td>
                  <td>
                    <a href="#" className="risks-link">查看详情</a>
                    <a href="#" className="risks-link-success">标记为已处理</a>
                  </td>
                </tr>
                <tr>
                  <td className="enterprise-name">示例企业 B</td>
                  <td className="risk-medium">中风险</td>
                  <td>2026-03-17 09:15</td>
                  <td>物流风险</td>
                  <td>
                    <span className="risks-badge risks-badge-yellow">处理中</span>
                  </td>
                  <td>
                    <a href="#" className="risks-link">查看详情</a>
                    <a href="#" className="risks-link-success">标记为已处理</a>
                  </td>
                </tr>
                <tr>
                  <td className="enterprise-name">示例企业 C</td>
                  <td className="risk-low">低风险</td>
                  <td>2026-03-16 16:45</td>
                  <td>合规风险</td>
                  <td>
                    <span className="risks-badge risks-badge-green">已处理</span>
                  </td>
                  <td>
                    <a href="#" className="risks-link">查看详情</a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="risks-pagination">
            <div className="risks-pagination-info">
              显示 <span>1</span> 到 <span>3</span> 共 <span>12</span> 条记录
            </div>
            <div className="risks-pagination-buttons">
              <button className="risks-pagination-btn" disabled>
                上一页
              </button>
              <button className="risks-pagination-btn active">
                1
              </button>
              <button className="risks-pagination-btn">
                2
              </button>
              <button className="risks-pagination-btn">
                3
              </button>
              <button className="risks-pagination-btn">
                4
              </button>
              <button className="risks-pagination-btn">
                下一页
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
