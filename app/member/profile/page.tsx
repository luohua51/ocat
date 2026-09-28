'use client';

import { useEffect, useRef, useState } from 'react';
import { fetchCurrentUser, type User } from '@/lib/auth';

const AVATAR_KEY = 'orangecat_avatar_';

export default function MemberProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [avatar, setAvatar] = useState('');
  const [nickname, setNickname] = useState('');
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCurrentUser().then((u) => {
      if (!u) return;
      setUser(u);
      setNickname(u.nickname);
      const savedAvatar = localStorage.getItem(AVATAR_KEY + u.id);
      if (savedAvatar) setAvatar(savedAvatar);
    });
  }, []);

  if (!user) {
    return <div style={{ color: '#fff', padding: '2rem', textAlign: 'center' }}>加载中…</div>;
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return alert('请选择图片文件');
    if (file.size > 2 * 1024 * 1024) return alert('图片不能超过 2MB');

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setAvatar(base64);
      if (user) localStorage.setItem(AVATAR_KEY + user.id, base64);
    };
    reader.readAsDataURL(file);
  }

  function handleSave() {
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
            {avatar ? <img src={avatar} alt="avatar" /> : user.nickname.charAt(0)}
            <div className="player-avatar-overlay">📷 更换</div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
          <button className="player-avatar-btn" onClick={() => fileRef.current?.click()}>上传头像</button>
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
            <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} />
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
    </>
  );
}