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
import {
  VOICE_TAGS,
  STYLE_TAGS,
  MAX_VOICE,
  MAX_STYLE,
  MAX_CUSTOM_LENGTH,
} from '@/lib/player-tags';

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

  const [voiceTags, setVoiceTags] = useState<string[]>([]);
  const [styleTags, setStyleTags] = useState<string[]>([]);
  const [customVoice, setCustomVoice] = useState('');
  const [customStyle, setCustomStyle] = useState('');

  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const [data, g, tagRes] = await Promise.all([
      fetchMyPlayerProfile(),
      fetchGames(),
      fetch('/api/player/tags', { cache: 'no-store' }).then((r) => r.json()),
    ]);
    setGames(g);

    if (data.player) {
      setPlayer(data.player);
      setName(data.player.name || '');
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
        .filter((x): x is string => !!x);
      setSelectedGames(names);
    } else {
      setSelectedGames([]);
    }

    if (tagRes && tagRes.ok) {
      setVoiceTags(tagRes.voice || []);
      setStyleTags(tagRes.style || []);
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

  function toggleTag(category: 'voice' | 'style', tag: string) {
    if (category === 'voice') {
      if (voiceTags.includes(tag)) {
        setVoiceTags(voiceTags.filter((x) => x !== tag));
      } else {
        if (voiceTags.length >= MAX_VOICE) {
          alert(`声音标签最多 ${MAX_VOICE} 个`);
          return;
        }
        setVoiceTags([...voiceTags, tag]);
      }
    } else {
      if (styleTags.includes(tag)) {
        setStyleTags(styleTags.filter((x) => x !== tag));
      } else {
        if (styleTags.length >= MAX_STYLE) {
          alert(`风格标签最多 ${MAX_STYLE} 个`);
          return;
        }
        setStyleTags([...styleTags, tag]);
      }
    }
  }

  function addCustom(category: 'voice' | 'style') {
    if (category === 'voice') {
      const v = customVoice.trim();
      if (!v) return;
      if (v.length > MAX_CUSTOM_LENGTH) {
        return alert(`自定义标签最多 ${MAX_CUSTOM_LENGTH} 字`);
      }
      if (voiceTags.includes(v)) return alert('已经加过');
      if (voiceTags.length >= MAX_VOICE) {
        return alert(`声音标签最多 ${MAX_VOICE} 个`);
      }
      setVoiceTags([...voiceTags, v]);
      setCustomVoice('');
    } else {
      const v = customStyle.trim();
      if (!v) return;
      if (v.length > MAX_CUSTOM_LENGTH) {
        return alert(`自定义标签最多 ${MAX_CUSTOM_LENGTH} 字`);
      }
      if (styleTags.includes(v)) return alert('已经加过');
      if (styleTags.length >= MAX_STYLE) {
        return alert(`风格标签最多 ${MAX_STYLE} 个`);
      }
      setStyleTags([...styleTags, v]);
      setCustomStyle('');
    }
  }

  function removeTag(category: 'voice' | 'style', tag: string) {
    if (category === 'voice') {
      setVoiceTags(voiceTags.filter((x) => x !== tag));
    } else {
      setStyleTags(styleTags.filter((x) => x !== tag));
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

    await load();
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

    if (!r.ok) {
      setSaving(false);
      return alert(r.error || '保存资料失败');
    }

    const tagRes = await fetch('/api/player/tags', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voice: voiceTags, style: styleTags }),
    });
    const tagData = await tagRes.json();
    setSaving(false);

    if (!tagData.ok) {
      return alert(tagData.error || '保存标签失败');
    }

    alert('已保存');
    await load();
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

        {/* 声音特点 */}
        <div className="player-form-block">
          <div className="player-form-label">
            🎤 声音特点（最多 {MAX_VOICE} 个，已选 {voiceTags.length}）
          </div>
          <div className="tag-selector">
            {VOICE_TAGS.map((t) => (
              <button
                key={t}
                type="button"
                className={
                  'player-filter-chip' +
                  (voiceTags.includes(t) ? ' active' : '')
                }
                onClick={() => toggleTag('voice', t)}
              >
                {t}
              </button>
            ))}
          </div>

          {voiceTags.filter((t) => !VOICE_TAGS.includes(t)).length > 0 && (
            <div className="tag-custom-row" style={{ marginTop: '0.5rem' }}>
              {voiceTags
                .filter((t) => !VOICE_TAGS.includes(t))
                .map((t) => (
                  <span key={t} className="tag-custom-item">
                    {t}
                    <button
                      type="button"
                      className="tag-custom-remove"
                      onClick={() => removeTag('voice', t)}
                    >
                      ×
                    </button>
                  </span>
                ))}
            </div>
          )}

          <div className="tag-custom-input">
            <input
              className="player-input"
              type="text"
              placeholder={`自定义补充（最多 ${MAX_CUSTOM_LENGTH} 字）`}
              value={customVoice}
              onChange={(e) => setCustomVoice(e.target.value)}
              maxLength={MAX_CUSTOM_LENGTH}
            />
            <button
              type="button"
              className="player-btn-sm"
              onClick={() => addCustom('voice')}
            >
              添加
            </button>
          </div>
        </div>

        {/* 战斗风格 */}
        <div className="player-form-block">
          <div className="player-form-label">
            ⚔️ 战斗风格（最多 {MAX_STYLE} 个，已选 {styleTags.length}）
          </div>
          <div className="tag-selector">
            {STYLE_TAGS.map((t) => (
              <button
                key={t}
                type="button"
                className={
                  'player-filter-chip' +
                  (styleTags.includes(t) ? ' active' : '')
                }
                onClick={() => toggleTag('style', t)}
              >
                {t}
              </button>
            ))}
          </div>

          {styleTags.filter((t) => !STYLE_TAGS.includes(t)).length > 0 && (
            <div className="tag-custom-row" style={{ marginTop: '0.5rem' }}>
              {styleTags
                .filter((t) => !STYLE_TAGS.includes(t))
                .map((t) => (
                  <span key={t} className="tag-custom-item">
                    {t}
                    <button
                      type="button"
                      className="tag-custom-remove"
                      onClick={() => removeTag('style', t)}
                    >
                      ×
                    </button>
                  </span>
                ))}
            </div>
          )}

          <div className="tag-custom-input">
            <input
              className="player-input"
              type="text"
              placeholder={`自定义补充（最多 ${MAX_CUSTOM_LENGTH} 字）`}
              value={customStyle}
              onChange={(e) => setCustomStyle(e.target.value)}
              maxLength={MAX_CUSTOM_LENGTH}
            />
            <button
              type="button"
              className="player-btn-sm"
              onClick={() => addCustom('style')}
            >
              添加
            </button>
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