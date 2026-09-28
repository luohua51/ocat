'use client';

import { MOCK_GAMES } from '@/lib/mock';

export default function AdminGamesPage() {
  return (
    <>
      <div className="admin-header">
        <h1 className="admin-title">游戏管理</h1>
        <p className="admin-subtitle">共 {MOCK_GAMES.length} 款游戏</p>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>游戏名</th>
              <th>段位列表</th>
              <th>排序</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_GAMES.map((g) => (
              <tr key={g.id}>
                <td>{g.id}</td>
                <td style={{ fontWeight: 700 }}>{g.name}</td>
                <td style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {g.ranks.join(' / ')}
                </td>
                <td>{g.sortOrder}</td>
                <td>
                  <span className="admin-badge admin-badge-green">启用</span>
                </td>
                <td>
                  <button className="admin-btn-sm">编辑</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}