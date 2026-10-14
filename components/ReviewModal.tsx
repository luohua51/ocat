'use client';

import { useState } from 'react';
import { submitReview } from '@/lib/order';

type Props = {
  orderId: number;
  toName: string;
  toRole: 'member' | 'player';
  onClose: () => void;
  onSuccess: () => void;
};

const REVIEW_TAGS = ['技术强', '态度好', '准时', '声音好听', '温柔', '幽默', '有耐心', '带我赢'];

export default function ReviewModal({ orderId, toName, toRole, onClose, onSuccess }: Props) {
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function toggleTag(tag: string) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    const res = await submitReview({
      orderId,
      rating,
      content: content.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
      isAnonymous,
    });
    setSubmitting(false);
    if (!res.ok) {
      alert(res.error || '评价失败');
      return;
    }
    onSuccess();
  }

  const roleLabel = toRole === 'player' ? '陪玩' : '老板';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="review-modal" onClick={(e) => e.stopPropagation()}>
        <div className="review-modal-title">评价{roleLabel}</div>
        <div className="review-modal-sub">给 {toName} 的服务打分</div>

        <div className="review-stars">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className={`review-star${n <= rating ? ' active' : ''}`}
              onClick={() => setRating(n)}
            >
              ★
            </button>
          ))}
          <span className="review-star-label">{rating}.0</span>
        </div>

        <div className="review-tags">
          {REVIEW_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`review-tag${tags.includes(tag) ? ' active' : ''}`}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>

        <textarea
          className="review-textarea"
          rows={4}
          placeholder="写下你的评价（选填）"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <label className="review-anon">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
          />
          匿名评价
        </label>

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: '0.7rem',
              borderRadius: '0.55rem',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              flex: 1,
              padding: '0.7rem',
              borderRadius: '0.55rem',
              border: 'none',
              background: 'linear-gradient(135deg, #FF6F2C, #E85D1F)',
              color: '#fff',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? '提交中…' : '提交评价'}
          </button>
        </div>
      </div>
    </div>
  );
}
