'use client';

export default function AdminSettingsPage() {
  return (
    <>
      <div className="admin-header">
        <h1 className="admin-title">平台设置</h1>
        <p className="admin-subtitle">平台级参数配置</p>
      </div>

      <div className="admin-settings-grid">
        <div className="admin-settings-card">
          <div className="admin-settings-label">平台名称</div>
          <div className="admin-settings-value">陪玩平台</div>
        </div>

        <div className="admin-settings-card">
          <div className="admin-settings-label">散陪抽成</div>
          <div className="admin-settings-value">2%</div>
        </div>

        <div className="admin-settings-card">
          <div className="admin-settings-label">店铺抽成（平台）</div>
          <div className="admin-settings-value">1%</div>
        </div>

        <div className="admin-settings-card">
          <div className="admin-settings-label">散陪最低时薪</div>
          <div className="admin-settings-value">¥9.9</div>
        </div>

        <div className="admin-settings-card">
          <div className="admin-settings-label">订单最小时长</div>
          <div className="admin-settings-value">0.5 小时</div>
        </div>

        <div className="admin-settings-card">
          <div className="admin-settings-label">提现审核</div>
          <div className="admin-settings-value">人工审核</div>
        </div>
      </div>


      <div className="admin-section" style={{ marginTop: '2rem' }}>
        <h2 className="admin-section-title">说明</h2>
        <div
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '0.9rem',
            padding: '1.2rem 1.4rem',
            color: 'rgba(255,255,255,0.6)',
            fontSize: '0.88rem',
            lineHeight: 1.8,
          }}
        >
          这些设置目前为静态展示，接入数据库后可在后台直接修改。
          <br />
          后续版本会支持：抽成比例动态调整、游戏增删改、段位字典维护、平台公告发布。
        </div>
      </div>
    </>
  );
}