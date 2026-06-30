import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, Feedback } from '../api';
import { formatDate } from '../utils';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const refreshCount = useCallback(async () => {
    try {
      const res = await api.getUnreadFeedbackCount();
      setCount(res.count);
    } catch {
      // ignore polling errors
    }
  }, []);

  const loadDetails = useCallback(async () => {
    setLoading(true);
    try {
      const mine = await api.getMyFeedback();
      const unread = mine.filter((item) => item.replyUnread);
      setItems(unread);
      setCount(unread.length);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCount();
    const timer = window.setInterval(refreshCount, 60_000);
    return () => window.clearInterval(timer);
  }, [refreshCount]);

  useEffect(() => {
    if (!open) {
      return;
    }
    loadDetails();
    function onDocClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open, loadDetails]);

  async function handleOpen() {
    const next = !open;
    setOpen(next);
    if (next) {
      await api.markFeedbackRead();
      setCount(0);
    }
  }

  return (
    <div className="notify-wrap" ref={panelRef}>
      <button
        type="button"
        className={`notify-btn ${count > 0 ? 'notify-btn--active' : ''}`}
        onClick={handleOpen}
        aria-label={count > 0 ? `Уведомления: ${count} новых ответов` : 'Уведомления'}
        aria-expanded={open}
      >
        <span className="notify-icon" aria-hidden="true">
          🔔
        </span>
        {count > 0 && <span className="notify-badge">{count > 9 ? '9+' : count}</span>}
      </button>

      {open && (
        <div className="notify-panel" role="dialog" aria-label="Ответы на ваши отзывы">
          <div className="notify-panel-head">
            <strong>Ответы команды</strong>
          </div>
          {loading && <p className="notify-empty">Загрузка…</p>}
          {!loading && items.length === 0 && (
            <p className="notify-empty">Новых ответов нет. Отзывы — в разделе «Мои отзывы».</p>
          )}
          {!loading &&
            items.map((item) => (
              <div key={item.id} className="notify-item">
                <p className="notify-item-meta">{formatDate(item.repliedAt ?? item.createdAt)}</p>
                {item.adminInitiated ? (
                  <p className="notify-item-reply">{item.message}</p>
                ) : (
                  <>
                    <p className="notify-item-quote">
                      «{item.message.slice(0, 80)}
                      {item.message.length > 80 ? '…' : ''}»
                    </p>
                    <p className="notify-item-reply">{item.adminReply}</p>
                  </>
                )}
              </div>
            ))}
          <Link to="/app/feedback" className="notify-panel-link" onClick={() => setOpen(false)}>
            Все мои отзывы →
          </Link>
        </div>
      )}
    </div>
  );
}
