import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLogo from '../components/AppLogo';
import AppHomeLink from '../components/AppHomeLink';
import NotificationBell from '../components/NotificationBell';
import { api, Feedback } from '../api';
import { useAuth } from '../hooks/useAuth';
import { formatDate } from '../utils';

export default function FeedbackPage() {
  const { username, logout, isAdmin } = useAuth();
  const [message, setMessage] = useState('');
  const [items, setItems] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await api.markFeedbackRead();
      setItems(await api.getMyFeedback());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = message.trim();
    if (text.length < 5) {
      setError('Отзыв должен быть не короче 5 символов');
      return;
    }
    if (text.length > 2000) {
      setError('Отзыв не длиннее 2000 символов');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.createFeedback(text);
      setMessage('');
      setSuccess('Спасибо! Отзыв отправлен.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка отправки');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="header-bar">
        <AppLogo to="/app" />
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)' }}>Привет, {username}</span>
          <NotificationBell />
          <AppHomeLink />
          {isAdmin && (
            <Link to="/app/admin" className="btn btn-admin">
              Админка
            </Link>
          )}
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Выйти
          </button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="grid-2">
        <div className="card">
          <h3 style={{ marginBottom: 12 }}>Оставить отзыв</h3>
          <p className="field-hint" style={{ marginBottom: 16 }}>
            Расскажите, что нравится, чего не хватает или что бы вы хотели видеть в приложении. Мы
            отвечаем на отзывы в этом разделе.
          </p>
          <form onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label>Ваш отзыв</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={2000}
                rows={6}
                placeholder="Например: добавьте экспорт в PDF или больше типов консистенции…"
              />
              <span className="field-hint">От 5 до 2000 символов · {message.trim().length}/2000</span>
            </div>
            {success && <p style={{ color: 'var(--success)', marginBottom: 12 }}>{success}</p>}
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Отправка…' : 'Отправить отзыв'}
            </button>
          </form>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Мои отзывы</h3>
          {loading && <p style={{ color: 'var(--text-muted)' }}>Загрузка…</p>}
          {!loading && items.length === 0 && (
            <p style={{ color: 'var(--text-muted)' }}>Пока нет отзывов — будем рады первому!</p>
          )}
          <div className="feedback-list">
            {items.map((item) => (
              <div
                key={item.id}
                className={`feedback-item ${item.replyUnread ? 'feedback-item--unread' : ''}`}
              >
                <div className="feedback-meta">
                  {formatDate(item.createdAt)}
                  {item.replyUnread && (
                    <span className="feedback-unread-tag">
                      {item.adminInitiated ? 'Новое сообщение' : 'Новый ответ'}
                    </span>
                  )}
                </div>
                {item.adminInitiated ? (
                  <div className="feedback-reply">
                    <strong>Сообщение от команды</strong>
                    <p>{item.message}</p>
                  </div>
                ) : (
                  <>
                    <p className="feedback-message">{item.message}</p>
                    {item.adminReply && (
                      <div className="feedback-reply">
                        <strong>Ответ команды</strong>
                        <p>{item.adminReply}</p>
                        {item.repliedAt && (
                          <span className="feedback-meta">{formatDate(item.repliedAt)}</span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
