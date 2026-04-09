'use client';

interface RecentSearch {
  id: number;
  company: string;
  date: string;
  complianceRisk: string;
  paymentRisk: string;
  score: string;
}

interface RecentSearchesProps {
  searches: RecentSearch[];
}

export default function RecentSearches({ searches }: RecentSearchesProps) {
  return (
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
              {searches.map((search) => (
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
  );
}