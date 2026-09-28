'use client';

import { useEffect, useState } from 'react';
import {
  fetchGames,
  createGame,
  updateGame,
  deleteGame,
  type Game,
} from '@/lib/game';

export default function AdminGamesPage() {
  const [list, setList] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCreate, setShowCreate] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [ranksText, setRanksText] = useState('');
  const [hasRank, setHasRank] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 编辑
  const [editing, setEditing] = useState<Game | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editRanks, setEditRanks] = useState('');
  const [editHasRank, setEditHasRank] = useState(true);

  useEffect(() => {
    fetchGames().then((data) => {
      setList(data);
      setLoading(false);
    });
  }, [refreshKey]);

  function parseRanks(s: string): string[] {
    return s.split(/[,，、]/).map((x) => x.trim()).filter(Boolean);
  }

  async function handleCreate() {
    setError('');
    if (!name.trim()) return setError('请输入游戏名');

    setSubmitting(true);
    const r = await createGame({
      name: name.trim(),
      description: description.trim(),
      ranks: parseRanks(ranksText),
      hasRank,
      sortOrder,
    });
    setSubmitting(false);

    if (!r.ok) return setError(r.error || '创建失败');

    alert('创建成功');
    setName('');
    setDescription('');
    setRanksText('');
    setHasRank(true);
    setSortOrder(0);
    setShowCreate(false);
    setRefreshKey((k) => k + 1);
  }

  function openEdit(g: Game) {
    setEditing(g);
    setEditName(g.name);
    setEditDesc(g.description || '');
    setEditRanks((g.ranks || []).join(', '));
    setEditHasRank(g.has_rank);
  }

  async function handleSaveEdit() {
    if (!editing) return;
    const r = await updateGame(editing.id, {
      name: editName.trim(),
      description: editDesc.trim(),
      ranks: parseRanks(editRanks),
      has_rank: editHasRank,
    } as any);

    if (!r.ok) return alert(r.error || '保存失败');
    alert('已保存');
    setEditing(null);
    setRefreshKey((k) => k + 1);
  }

  async function handleDelete(g: Game) {
    if (!confirm(`停用「${g.name}」？`)) return;
    const r = await deleteGame(g.id);
    if (!r.ok) return alert(r.error || '失败');
    setRefreshKey((k) => k + 1);
  }

  return (
    <>
      <div className="admin-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="admin-title">游戏管理</h1>
            <p className="admin-subtitle">
              {loading ? '加载中…' : `共 ${list.length} 款游戏`}
            </p>
          </div>
          <button className="admin-btn-primary" onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? '取消' : '➕ 新增游戏'}
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="admin-create-card">
          <h3 className="admin-create-title">新增游戏</h3>
          <div className="admin-form-grid">
            <div className="admin-form-field">
              <label>游戏名</label>
              <input type="text" placeholder="如：英雄联盟" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="admin-form-field">
              <label>简介（可选）</label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="admin-form-field">
              <label>排序（越小越靠前）</label>
              <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} />
            </div>
            <div className="admin-form-field" style={{ gridColumn: '1 / -1' }}>
              <label>段位列表（用逗号分隔）</label>
              <input type="text" placeholder="如：青铜, 白银, 黄金" value={ranksText} onChange={(e) => setRanksText(e.target.value)} />
            </div>
            <div className="admin-form-field">
              <label>有无段位</label>
              <select value={hasRank ? 'yes' : 'no'} onChange={(e) => setHasRank(e.target.value === 'yes')}>
                <option value="yes">有段位</option>
                <option value="no">无段位（纯娱乐）</option>
              </select>
            </div>
          </div>
          {error && <div className="admin-form-error">{error}</div>}
          <div className="admin-form-actions">
            <button className="admin-btn-primary" onClick={handleCreate} disabled={submitting}>
              {submitting ? '创建中…' : '确认创建'}
            </button>
          </div>
        </div>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>游戏名</th>
              <th>段位</th>
              <th>排序</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>
                  暂无游戏
                </td>
              </tr>
            ) : (
              list.map((g) => (
                <tr key={g.id}>
                  <td>{g.id}</td>
                  <td style={{ fontWeight: 700 }}>{g.name}</td>
                  <td style={{ color: 'rgba(255,255,255,0.6)' }}>
                    {g.ranks && g.ranks.length > 0 ? g.ranks.join(' / ') : '无'}
                  </td>
                  <td>{g.sort_order}</td>
                  <td>
                    {g.status === 'active' ? (
                      <span className="admin-badge admin-badge-green">启用</span>
                    ) : (
                      <span className="admin-badge admin-badge-red">停用</span>
                    )}
                  </td>
                  <td>
                    <button className="admin-btn-sm" onClick={() => openEdit(g)}>编辑</button>
                    {g.status === 'active' && (
                      <button className="admin-btn-sm admin-btn-danger" onClick={() => handleDelete(g)}>停用</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="admin-modal-overlay" onClick={() => setEditing(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="admin-modal-title">编辑 · {editing.name}</h3>
            <div className="admin-form-field">
              <label>游戏名</label>
              <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="admin-form-field">
              <label>简介</label>
              <input type="text" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
            </div>
            <div className="admin-form-field">
              <label>段位列表（逗号分隔）</label>
              <input type="text" value={editRanks} onChange={(e) => setEditRanks(e.target.value)} />
            </div>
            <div className="admin-form-field">
              <label>有无段位</label>
              <select value={editHasRank ? 'yes' : 'no'} onChange={(e) => setEditHasRank(e.target.value === 'yes')}>
                <option value="yes">有段位</option>
                <option value="no">无段位</option>
              </select>
            </div>
            <div className="admin-modal-actions">
              <button className="admin-btn-ghost" onClick={() => setEditing(null)}>取消</button>
              <button className="admin-btn-primary" onClick={handleSaveEdit}>保存</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}