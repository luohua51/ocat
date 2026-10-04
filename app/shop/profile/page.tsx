'use client';

import { useEffect, useRef, useState } from 'react';
import { proxyImage } from '@/lib/image';

export default function ShopProfilePage() {
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [businessHours, setBusinessHours] = useState('');
  const [contactWechat, setContactWechat] = useState('');
  const [logo, setLogo] = useState('');

  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    try {
      const res = await fetch('/api/shop/profile', { cache: 'no-store' });
      const data = await res.json();
      if (data.ok) {
        const s = data.shop;
        setShop(s);
        setName(s.name || '');
        setDescription(s.description || '');
        setBusinessHours(s.business_hours || '');
        setContactWechat(s.contact_wechat || '');
        setLogo(s.logo || '');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);

    try {
      const res = await fetch('/api/shop/logo', { method: 'POST', body: fd });
      const data = await res.json();
      if (!data.ok) {
        alert(data.error || '上传失败');
        return;
      }
      setLogo(data.logo);
      alert('已上传');
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!name.trim()) return alert('请填店铺名');

    setSaving(true);
    try {
      const res = await fetch('/api/shop/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description,
          businessHours,
          contactWechat,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        alert(data.error || '保存失败');
        return;
      }
      alert('已保存');
      await load();
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="shop-empty">加载中…</div>;
  if (!shop) return <div className="shop-empty">店铺不存在</div>;

  return (
    <>
      <div className="shop-header">
        <h1 className="shop-title">店铺资料</h1>
        <p className="shop-subtitle">这些信息会展示在店铺主页</p>
      </div>

      <div className="player-profile-card">
        <div className="player-avatar-uploader">
          <div
            className="player-profile-avatar"
            onClick={() => !uploading && fileRef.current?.click()}
          >
            {logo ? (
              <img src={proxyImage(logo)} alt="logo" />
            ) : (
              shop.name.charAt(0)
            )}
            <div className="player-avatar-overlay">
              {uploading ? '上传中…' : '📷 更换'}
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleLogoChange}
          />
          <button
            className="player-avatar-btn"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? '上传中…' : '上传店铺 Logo'}
          </button>
        </div>

        <div className="player-form-block">
          <div className="player-form-label">店铺名称</div>
          <input
            className="player-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="player-form-block">
          <div className="player-form-label">店铺简介</div>
          <textarea
            className="player-textarea"
            rows={3}
            placeholder="一句话介绍你的店铺"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="player-form-block">
          <div className="player-form-label">营业时间</div>
          <input
            className="player-input"
            type="text"
            placeholder="如：每日 10:00 - 02:00"
            value={businessHours}
            onChange={(e) => setBusinessHours(e.target.value)}
          />
        </div>

        <div className="player-form-block">
          <div className="player-form-label">客服微信</div>
          <input
            className="player-input"
            type="text"
            placeholder="如：cmmkefu"
            value={contactWechat}
            onChange={(e) => setContactWechat(e.target.value)}
          />
        </div>

        <button
          className="player-submit-btn"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? '保存中…' : '保存修改'}
        </button>
      </div>
    </>
  );
}