'use client';

import { useState } from 'react';

interface DetectionFormProps {
  onSubmit: (companyName: string, dataMonths: string) => void;
}

export default function DetectionForm({ onSubmit }: DetectionFormProps) {
  const [companyName, setCompanyName] = useState('');
  const [dataMonths, setDataMonths] = useState('3');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(companyName, dataMonths);
  };

  return (
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
  );
}