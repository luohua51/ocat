'use client';

import { useEffect, useRef, useState } from 'react';
import { fetchGames, type Game } from '@/lib/game';
import {
  fetchMyPlayerProfile,
  updateMyPlayerProfile,
  uploadAvatar,
  type PlayerProfile,
  type PlayerFull,
} from '@/lib/player';
import { proxyImage } from '@/lib/image';

export default function PlayerProfilePage() {
  const [player, setPlayer] = useState<PlayerFull | null>(null);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [name, setName] = useState('');
  const [signature, setSignature] = useState('');
  const [description, setDescription] = useState('');
  const [rankText, setRankText] = useState('');
  const [availableTime, setAvailableTime] = useState('');
  const [selectedGames, setSelectedGames] = useState<string[]>([]);

  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const [data, g] = await Promise.all([fetchMyPlayerProfile(), fetchGames()]);
    setGames(g);

    if (data.player) {
      setPlayer(data.player);
      setName(data.player.name);
    }

    if (data.profile) {
      setProfile(data.profile);
      setSignature(data.profile.signature || '');
      setDescription(data.profile.description || '');
      setRankText(data.profile.rank_text || '');
      setAvailableTime(data.profile.available_time || '');
    }

    if (data.capabilities.length > 0 && g.length > 0) {
      const names = data.capabilities
        .map((c) => g.find((x) => x.id === c.game_id)?.name)
        .filter(Boolean) as string[];
      setSelectedGames(names);
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleGame(g: string) {
    if (selectedGames.includes(g)) {
      setSelectedGames(selectedGames.filter((x) => x !== g));
    } else {
      setSelectedGames([...selectedGames, g]);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const r = await uploadAvatar(file);
    setUploading(false);

    if (!r.ok) {
      alert(r.error || '上传失败');
      return;
    }

    const data = await fetchMyPlayerProfile();
    setPlayer(data.player);
  }

  async function handleSave() {
    if (!name.trim()) return alert('请填昵称');

    setSaving(true);
    const r = await updateMyPlayerProfile({
      name: name.trim(),
      signature,
      description,
      rankText,
      availableTime,
      games: selectedGames,
    });
    setSaving(false);

    if (!r.ok) {
      alert(r.error || '保存失败');
      return;
    }

    alert('已保存');
  }

  if (loading) {
    return <div className="player-empty">加载中…</div>;
  }

  return (
    <>
      <div className="player-header">
        <h1 className="player-title">个人资料</h1>
        <p className="player-subtitle">资料越详细，被接单概率越高</p>
      </div>

      <div className="player-profile-card">
        <div className="player-avatar-uploader">
          <div
            className="player-profile-avatar"
            onClick={() => !uploading && fileRef.current?.click()}
          >
            {player?.avatar ? (
              <img src={proxyImage(player.avatar)} alt="avatar" />
            ) : (
              (player?.name || '?').charAt(0)
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
            onChange={handleAvatarChange}
          />
          <button
            className="player-avatar-btn"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? '上传中…' : '上传头像'}
          </button>
        </div>

        <div className="player-form-block">
          <div className="player-form-label">昵称</div>
          <input
            className="player-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="player-form-block">
          <div className="player-form-label">个性签名</div>
          <input
            className="player-input"
            type="text"
            placeholder="一句话介绍自己"
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
          />
        </div>

        <div className="player-form-block">
          <div className="player-form-label">段位说明（自由填写）</div>
          <input
            className="player-input"
            type="text"
            placeholder="如：永劫修罗、瓦钻石"
            value={rankText}
            onChange={(e) => setRankText(e.target.value)}
          />
        </div>

        <div className="player-form-block">
          <div className="player-form-label">可接游戏</div>
          <div className="player-filter-chips">
            {games.map((g) => (
              <button
                key={g.id}
                type="button"
                className={
                  'player-filter-chip' +
                  (selectedGames.includes(g.name) ? ' active' : '')
                }
                onClick={() => toggleGame(g.name)}
              >
                {g.name}
              </button>
            ))}
          </div>
        </div>

        <div className="player-form-block">
          <div className="player-form-label">接单时间</div>
          <input
            className="player-input"
            type="text"
            placeholder="如：每日 18:00 - 02:00"
            value={availableTime}
            onChange={(e) => setAvailableTime(e.target.value)}
          />
        </div>

        <div className="player-form-block">
          <div className="player-form-label">个人介绍</div>
          <textarea
            className="player-textarea"
            rows={5}
            placeholder="介绍你的游戏风格、擅长的英雄/位置、脾气性格等"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
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

      <div className="player-note">
        💡 认证档位（金牌/魔王/明星）由店铺管理员授予，你自己无法修改。
      </div>
    </>
  );
}