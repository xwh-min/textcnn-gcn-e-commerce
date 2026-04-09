import './styles.css';

export default function SettingsPage() {
  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="settings-header">
          <h1 className="settings-title">系统设置</h1>
          <p className="settings-subtitle">系统配置和用户管理</p>
        </div>
        
        <div className="settings-grid">
          <div className="settings-sidebar">
            <div className="settings-nav">
              <h3 className="settings-nav-title">设置选项</h3>
              <ul className="settings-nav-list">
                <li>
                  <a href="#" className="settings-nav-item active">
                    <svg className="settings-nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                    系统配置
                  </a>
                </li>
                <li>
                  <a href="#" className="settings-nav-item">
                    <svg className="settings-nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    用户管理
                  </a>
                </li>
                <li>
                  <a href="#" className="settings-nav-item">
                    <svg className="settings-nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                    </svg>
                    API设置
                  </a>
                </li>
                <li>
                  <a href="#" className="settings-nav-item">
                    <svg className="settings-nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v11a3 3 0 106 0V6a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-16a2 2 0 114 0v5a2 2 0 01-2 2H8V2z" clipRule="evenodd" />
                      <path d="M12 11c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3z" />
                    </svg>
                    通知设置
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="settings-content">
            <div className="settings-form-card">
              <h3 className="settings-form-title">系统配置</h3>
              <form className="settings-form">
                <div className="settings-form-group">
                  <label htmlFor="systemName" className="settings-form-label">系统名称</label>
                  <input
                    id="systemName"
                    name="systemName"
                    type="text"
                    value="跨境电商风险检测系统"
                    className="settings-form-input"
                  />
                </div>
                <div className="settings-form-group">
                  <label htmlFor="maxRecords" className="settings-form-label">最大记录数</label>
                  <input
                    id="maxRecords"
                    name="maxRecords"
                    type="number"
                    value="10000"
                    className="settings-form-input"
                  />
                </div>
                <div className="settings-form-group">
                  <label htmlFor="autoDeleteDays" className="settings-form-label">自动删除记录天数</label>
                  <input
                    id="autoDeleteDays"
                    name="autoDeleteDays"
                    type="number"
                    value="90"
                    className="settings-form-input"
                  />
                </div>
                <div className="settings-form-group">
                  <label className="settings-form-label">启用自动检测</label>
                  <div className="settings-form-checkbox-group">
                    <input
                      id="autoDetection"
                      name="autoDetection"
                      type="checkbox"
                      checked
                      className="settings-form-checkbox"
                    />
                    <label htmlFor="autoDetection" className="settings-form-checkbox-label">
                      启用自动检测功能
                    </label>
                  </div>
                </div>
                <div>
                  <button
                    type="submit"
                    className="settings-form-button"
                  >
                    保存设置
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}