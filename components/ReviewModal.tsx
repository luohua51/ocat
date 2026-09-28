'use client';

import { useState } from 'react';
import { submitReview } from '@/lib/order';

type Props = {
  orderId: number;
  toName: string;
  toRole: 'player' | 'member';
  onClose: () => void;
  onSuccess: () => void;
};

const PLAYER_TAGS = ['技术好', '不压力', '准时', '声音好听', '会聊天', '带飞', '教学认真', '有耐心'];
const MEMBER_TAGS = ['爽快', '好说话', '守时', '大方', '沟通顺畅', '素质高'];

export default function ReviewModal({ orderId, toName, toRole, onClose, onSuccess }: Props) {
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const tags = toRole === 'player' ? PLAYER_TAGS : MEMBER_TAGS;

  function toggleTag(t: string) {
    if (selectedTags.includes(t)) {
      setSelectedTags(selectedTags.filter((x) => x !== t));
    } else {
      setSelectedTags([...selectedTags, t]);
    }
  }

  async function handleSubmit() {
    setError('');
    setSubmitting(true);

    const r = await submitReview({
      orderId,
      rating,
      content,
      tags: selectedTags,
      isAnonymous,
    });

    setSubmitting(false);

    if (!r.ok) {
      setError(r.error || '提交失败');
      return;
    }

    onSuccess();
  }

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="review-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="review-modal-title">
          评价 {toRole === 'player' ? '陪玩' : '老板'}
        </h3>
        <p className="review-modal-sub">{toName}</p>

        <div className="review-stars">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className={'review-star' + (n <= rating ? ' active' : '')}
              onClick={() => setRating(n)}
            >
              ★
            </button>
          ))}
          <span className="review-star-label">{rating} 分</span>
        </div>

        <div className="review-tags">
          {tags.map((t) => (
            <button
              key={t}
              type="button"
              className={'review-tag' + (selectedTags.includes(t) ? ' active' : '')}
              onClick={() => toggleTag(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <textarea
          className="review-textarea"
          placeholder="说点什么吧（可选）"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
        />

        <label className="review-anon">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
          />
          匿名评价
        </label>

        {error && <div className="admin-form-error">{error}</div>}

        <div className="admin-modal-actions">
          <button className="admin-btn-ghost" onClick={onClose}>
            取消
          </button>
          <button
            className="admin-btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? '提交中…' : '提交评价'}
          </button>
        </div>
      </div>
    </div>
  );
}