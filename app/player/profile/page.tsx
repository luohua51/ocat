'use client';

import { useEffect, useRef, useState } from 'react';
import { GAMES } from '@/lib/mock';
import { fetchCurrentUser, type User } from '@/lib/auth';

const AVATAR_KEY = 'orangecat_avatar_';

export default function PlayerProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [avatar, setAvatar] = useState('');
  const [nickname, setNickname] = useState('');
  const [signature, setSignature] = useState('泥真的要点一单客服嘛');
  const [description, setDescription] = useState('主玩永劫无间三排天选模式，擅长长剑+阔刀。');
  const [rankText, setRankText] = useState('永劫修罗、瓦钻石');
  const [availableTime, setAvailableTime] = useState('每日 18:00 - 02:00');
  const [selectedGames, setSelectedGames] = useState<string[]>(['永劫无间']);
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

  function toggleGame(g: string) {
    if (selectedGames.includes(g)) setSelectedGames(selectedGames.filter((x) => x !== g));
    else setSelectedGames([...selectedGames, g]);
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
      <div className="player-header">
        <h1 className="player-title">个人资料</h1>
        <p className="player-subtitle">资料越详细，被接单概率越高</p>
      </div>

      <div className="player-profile-card">
        <div className="player-avatar-uploader">
          <div className="player-profile-avatar" onClick={() => fileRef.current?.click()}>
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

        <div className="player-form-block">
          <div className="player-form-label">昵称</div>
          <input className="player-input" type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} />
        </div>
        <div className="player-form-block">
          <div className="player-form-label">个性签名</div>
          <input className="player-input" type="text" value={signature} onChange={(e) => setSignature(e.target.value)} />
        </div>
        <div className="player-form-block">
          <div className="player-form-label">段位说明</div>
          <input className="player-input" type="text" value={rankText} onChange={(e) => setRankText(e.target.value)} />
        </div>
        <div className="player-form-block">
          <div className="player-form-label">可接游戏</div>
          <div className="player-filter-chips">
            {GAMES.map((g) => (
              <button
                key={g}
                className={'player-filter-chip' + (selectedGames.includes(g) ? ' active' : '')}
                onClick={() => toggleGame(g)}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
        <div className="player-form-block">
          <div className="player-form-label">接单时间</div>
          <input className="player-input" type="text" value={availableTime} onChange={(e) => setAvailableTime(e.target.value)} />
        </div>
        <div className="player-form-block">
          <div className="player-form-label">个人介绍</div>
          <textarea className="player-textarea" rows={5} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <button className="player-submit-btn" onClick={handleSave}>
          {saved ? '✅ 已保存' : '保存修改'}
        </button>
      </div>
    </>
  );
}