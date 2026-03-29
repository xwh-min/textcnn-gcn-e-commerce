import './styles.css';

export default function EnterprisesPage() {
  return (
    <div className="enterprises-page">
      <div className="enterprises-container">
        <div className="enterprises-header">
          <h1 className="enterprises-title">企业管理</h1>
          <p className="enterprises-subtitle">企业信息管理</p>
        </div>
        
        <div className="enterprises-actions">
          <button className="enterprises-add-btn">
            添加企业
          </button>
        </div>
        
        <div className="enterprises-card">
          <div className="enterprises-search">
            <div className="enterprises-search-container">
              <svg className="enterprises-search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{ width: '1.25rem', height: '1.25rem' }}>
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              <input
                type="text"
                className="enterprises-search-input"
                placeholder="搜索企业名称"
              />
            </div>
          </div>
          
          <div className="enterprises-table-container">
            <table className="enterprises-table">
              <thead>
                <tr>
                  <th>企业名称</th>
                  <th>统一社会信用代码</th>
                  <th>注册时间</th>
                  <th>最近检测时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="enterprise-name">示例企业 A</td>
                  <td>91110000MA12345678</td>
                  <td>2020-01-01</td>
                  <td>2026-03-17 10:30</td>
                  <td>
                    <a href="#" className="enterprises-link">编辑</a>
                    <a href="#" className="enterprises-link-danger">删除</a>
                  </td>
                </tr>
                <tr>
                  <td className="enterprise-name">示例企业 B</td>
                  <td>91110000MA87654321</td>
                  <td>2021-05-15</td>
                  <td>2026-03-17 09:15</td>
                  <td>
                    <a href="#" className="enterprises-link">编辑</a>
                    <a href="#" className="enterprises-link-danger">删除</a>
                  </td>
                </tr>
                <tr>
                  <td className="enterprise-name">示例企业 C</td>
                  <td>91110000MA98765432</td>
                  <td>2019-12-01</td>
                  <td>2026-03-16 16:45</td>
                  <td>
                    <a href="#" className="enterprises-link">编辑</a>
                    <a href="#" className="enterprises-link-danger">删除</a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="enterprises-pagination">
            <div className="enterprises-pagination-info">
              显示 <span>1</span> 到 <span>3</span> 共 <span>15</span> 条记录
            </div>
            <div className="enterprises-pagination-buttons">
              <button className="enterprises-pagination-btn" disabled>
                上一页
              </button>
              <button className="enterprises-pagination-btn active">
                1
              </button>
              <button className="enterprises-pagination-btn">
                2
              </button>
              <button className="enterprises-pagination-btn">
                3
              </button>
              <button className="enterprises-pagination-btn">
                下一页
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
