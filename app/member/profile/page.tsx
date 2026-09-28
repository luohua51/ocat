'use client';

import { useEffect, useRef, useState } from 'react';
import { getCurrentUser, type User } from '@/lib/auth';

const AVATAR_KEY = 'orangecat_avatar_';

export default function MemberProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [avatar, setAvatar] = useState('');
  const [nickname, setNickname] = useState('');
  const [saved, setSaved] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const u = getCurrentUser();
    if (u) {
      setUser(u);
      setNickname(u.nickname);
      const savedAvatar = localStorage.getItem(AVATAR_KEY + u.id);
      if (savedAvatar) setAvatar(savedAvatar);
    }
  }, []);

  if (!user) return null;

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('图片不能超过 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setAvatar(base64);
      if (user) {
        localStorage.setItem(AVATAR_KEY + user.id, base64);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleSave() {
    if (!user) return;
    const updated = { ...user, nickname };
    localStorage.setItem('orangecat_user', JSON.stringify(updated));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <>
      <div className="member-header">
        <h1 className="member-title">个人资料</h1>
        <p className="member-subtitle">修改后立即生效</p>
      </div>

      <div className="member-profile-card">
        <div className="player-avatar-uploader">
          <div className="member-profile-avatar" onClick={() => fileRef.current?.click()}>
            {avatar ? (
              <img src={avatar} alt="avatar" />
            ) : (
              user.nickname.charAt(0)
            )}
            <div className="player-avatar-overlay">📷 更换</div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleAvatarChange}
          />
          <button
            className="player-avatar-btn"
            onClick={() => fileRef.current?.click()}
          >
            上传头像
          </button>
          {avatar && (
            <button
              className="player-avatar-btn player-avatar-btn-danger"
              onClick={() => {
                setAvatar('');
                localStorage.removeItem(AVATAR_KEY + user.id);
              }}
            >
              删除头像
            </button>
          )}
        </div>

        <div className="member-form">
          <div className="member-field">
            <label>账号</label>
            <input type="text" value={user.username} disabled />
          </div>

          <div className="member-field">
            <label>昵称</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>

          <div className="member-field">
            <label>角色</label>
            <input type="text" value="会员" disabled />
          </div>

          <button className="member-save-btn" onClick={handleSave}>
            {saved ? '✅ 已保存' : '保存修改'}
          </button>
        </div>
      </div>

      <div className="member-section">
        <h2 className="member-section-title">账号安全</h2>
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
          忘记密码？请联系客服重置。
          <br />
          后续版本会支持：自助改密码、绑定手机号、实名认证。
        </div>
      </div>
    </>
  );
}