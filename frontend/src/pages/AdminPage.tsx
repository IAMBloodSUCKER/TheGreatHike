import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLogo from '../components/AppLogo';
import {
  AdminFeedback,
  AdminOverview,
  AdminTrackingOverview,
  AdminUser,
  api,
  Feedback,
  UserVisitStats,
} from '../api';
import AppHomeLink from '../components/AppHomeLink';
import AdminGate from '../components/AdminGate';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAuth } from '../hooks/useAuth';
import { formatDate, formatGrams } from '../utils';

type AdminTab = 'overview' | 'users' | 'feedback';

export default function AdminPage() {
  const { username, logout } = useAuth();
  const [adminSession, setAdminSession] = useState<string | null>(null);
  const [tab, setTab] = useState<AdminTab>('overview');
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [tracking, setTracking] = useState<AdminTrackingOverview | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [visitStats, setVisitStats] = useState<UserVisitStats[]>([]);
  const [items, setItems] = useState<Feedback[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userFeedback, setUserFeedback] = useState<AdminFeedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [directDraft, setDirectDraft] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [userActionLoading, setUserActionLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [blockTarget, setBlockTarget] = useState<AdminUser | null>(null);
  const [blockComment, setBlockComment] = useState('');

  const visitByUser = useMemo(() => {
    const map = new Map<string, UserVisitStats>();
    visitStats.forEach((s) => map.set(s.userId, s));
    return map;
  }, [visitStats]);

  const handleSessionLost = useCallback((err: unknown) => {
    const message = err instanceof Error ? err.message : '';
    if (message.includes('админк') || message.includes('403') || message.includes('подтверждение')) {
      setAdminSession(null);
    }
  }, []);

  const loadOverview = useCallback(async (session: string) => {
    const [authOverview, trackingOverview, userStats] = await Promise.all([
      api.getAdminOverview(session),
      api.getAdminTrackingOverview(session),
      api.getAdminUserVisitStats(session),
    ]);
    setOverview(authOverview);
    setTracking(trackingOverview);
    setVisitStats(userStats);
  }, []);

  const loadUsers = useCallback(async (session: string) => {
    setUsers(await api.getAdminUsers(session));
  }, []);

  const loadFeedback = useCallback(async (session: string) => {
    setItems(await api.getAllFeedback(session));
  }, []);

  const loadAll = useCallback(
    async (session: string) => {
      setLoading(true);
      setError('');
      try {
        await Promise.all([loadOverview(session), loadUsers(session), loadFeedback(session)]);
      } catch (err) {
        handleSessionLost(err);
        setError(err instanceof Error ? err.message : 'Ошибка загрузки');
      } finally {
        setLoading(false);
      }
    },
    [handleSessionLost, loadFeedback, loadOverview, loadUsers],
  );

  useEffect(() => {
    if (adminSession) {
      loadAll(adminSession);
    }
  }, [adminSession, loadAll]);

  async function selectUser(userId: string) {
    if (!adminSession) return;
    setSelectedUserId(userId);
    setDirectDraft('');
    setError('');
    try {
      setUserFeedback(await api.getAdminUserFeedback(userId, adminSession));
    } catch (err) {
      handleSessionLost(err);
      setError(err instanceof Error ? err.message : 'Ошибка загрузки отзывов');
    }
  }

  async function refreshUserPanel(session: string, userId: string) {
    await Promise.all([loadUsers(session), loadOverview(session)]);
    setUserFeedback(await api.getAdminUserFeedback(userId, session));
  }

  async function handleReply(e: FormEvent, id: string) {
    e.preventDefault();
    if (!adminSession) return;
    const reply = (replyDrafts[id] ?? '').trim();
    if (!reply) return;
    setSavingId(id);
    setError('');
    try {
      const updated = await api.replyToFeedback(id, reply, adminSession);
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
      setUserFeedback((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, adminReply: updated.adminReply, repliedAt: updated.repliedAt }
            : item,
        ),
      );
      setReplyDrafts((prev) => ({ ...prev, [id]: '' }));
      await loadOverview(adminSession);
      await loadUsers(adminSession);
    } catch (err) {
      handleSessionLost(err);
      setError(err instanceof Error ? err.message : 'Ошибка ответа');
    } finally {
      setSavingId(null);
    }
  }

  async function handleDirectMessage(e: FormEvent) {
    e.preventDefault();
    if (!adminSession || !selectedUserId) return;
    const text = directDraft.trim();
    if (!text) return;
    setUserActionLoading(true);
    setError('');
    try {
      const sent = await api.sendAdminDirectMessage(selectedUserId, text, adminSession);
      setUserFeedback((prev) => [sent, ...prev]);
      setDirectDraft('');
      await loadFeedback(adminSession);
      await refreshUserPanel(adminSession, selectedUserId);
    } catch (err) {
      handleSessionLost(err);
      setError(err instanceof Error ? err.message : 'Ошибка отправки');
    } finally {
      setUserActionLoading(false);
    }
  }

  async function toggleBlock(user: AdminUser) {
    if (!adminSession || user.admin) return;
    if (user.blocked) {
      setUserActionLoading(true);
      setError('');
      try {
        const updated = await api.unblockAdminUser(user.id, adminSession);
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      } catch (err) {
        handleSessionLost(err);
        setError(err instanceof Error ? err.message : 'Ошибка');
      } finally {
        setUserActionLoading(false);
      }
      return;
    }
    setBlockComment('');
    setBlockTarget(user);
  }

  async function confirmBlockUser() {
    if (!adminSession || !blockTarget) return;
    setUserActionLoading(true);
    setError('');
    try {
      const updated = await api.blockAdminUser(blockTarget.id, adminSession, blockComment);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setBlockTarget(null);
      setBlockComment('');
    } catch (err) {
      handleSessionLost(err);
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setUserActionLoading(false);
    }
  }

  async function confirmDeleteUser() {
    if (!adminSession || !deleteTarget) return;
    setUserActionLoading(true);
    setError('');
    try {
      await api.deleteAdminUser(deleteTarget.id, adminSession);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      if (selectedUserId === deleteTarget.id) {
        setSelectedUserId(null);
        setUserFeedback([]);
      }
      setDeleteTarget(null);
      await loadOverview(adminSession);
      await loadFeedback(adminSession);
    } catch (err) {
      handleSessionLost(err);
      setError(err instanceof Error ? err.message : 'Ошибка удаления');
    } finally {
      setUserActionLoading(false);
    }
  }

  function renderFeedbackItem(item: AdminFeedback | Feedback) {
    if (item.adminInitiated) {
      return (
        <div className="feedback-reply admin-existing-reply">
          <strong>Сообщение от команды</strong>
          <p>{item.message}</p>
          <span className="feedback-meta">{formatDate(item.createdAt)}</span>
        </div>
      );
    }
    return (
      <>
        <p className="feedback-message">{item.message}</p>
        {item.adminReply ? (
          <div className="feedback-reply admin-existing-reply">
            <strong>Ваш ответ</strong>
            <p>{item.adminReply}</p>
            {item.repliedAt && <span className="feedback-meta">{formatDate(item.repliedAt)}</span>}
          </div>
        ) : (
          <form className="admin-reply-form" onSubmit={(e) => handleReply(e, item.id)}>
            <textarea
              value={replyDrafts[item.id] ?? ''}
              onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))}
              rows={3}
              maxLength={2000}
              placeholder="Ответ на отзыв…"
              required
            />
            <button type="submit" className="btn btn-primary btn-sm" disabled={savingId === item.id}>
              {savingId === item.id ? 'Отправка…' : 'Ответить'}
            </button>
          </form>
        )}
      </>
    );
  }

  if (!adminSession) {
    return <AdminGate onUnlocked={setAdminSession} />;
  }

  const selectedUser = users.find((u) => u.id === selectedUserId);

  return (
    <>
      <div className="header-bar">
        <AppLogo to="/app" />
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)' }}>Админ · {username}</span>
          <button type="button" className="btn btn-ghost" onClick={() => setAdminSession(null)}>
            Заблокировать
          </button>
          <AppHomeLink />
          <Link to="/app/feedback" className="btn btn-ghost">
            Отзывы
          </Link>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Выйти
          </button>
        </div>
      </div>

      <div className="admin-tabs" role="tablist" aria-label="Разделы админки">
        {(
          [
            ['overview', 'Метрики'],
            ['users', 'Пользователи'],
            ['feedback', 'Все отзывы'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={`admin-tab ${tab === key ? 'active' : ''}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <p className="error">{error}</p>}
      {loading && <p style={{ color: 'var(--text-muted)' }}>Загрузка…</p>}

      {tab === 'overview' && overview && (
        <div className="admin-metrics-grid">
          <div className="card admin-metric">
            <span className="admin-metric-value">{overview.totalUsers}</span>
            <span className="admin-metric-label">Пользователей</span>
          </div>
          <div className="card admin-metric">
            <span className="admin-metric-value">{overview.totalFeedback}</span>
            <span className="admin-metric-label">Сообщений</span>
          </div>
          <div className="card admin-metric">
            <span className="admin-metric-value">{overview.unrepliedFeedback}</span>
            <span className="admin-metric-label">Отзывов без ответа</span>
          </div>
          {tracking && (
            <>
              <div className="card admin-metric">
                <span className="admin-metric-value">{tracking.totalVisits}</span>
                <span className="admin-metric-label">Записей в журнале</span>
              </div>
              <div className="card admin-metric">
                <span className="admin-metric-value">{formatGrams(tracking.totalGrams)}</span>
                <span className="admin-metric-label">Суммарно грамм</span>
              </div>
              <div className="card admin-metric">
                <span className="admin-metric-value">{tracking.activeUsers}</span>
                <span className="admin-metric-label">Активных трекеров</span>
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'users' && (
        <div className="admin-users-layout">
          <div className="card admin-users-list">
            <h3>Пользователи</h3>
            <p className="field-hint">Доступ только с подтверждённой админ-сессией.</p>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Логин</th>
                  <th>Отзывы</th>
                  <th>Визиты</th>
                  <th>Регистрация</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const visits = visitByUser.get(user.id);
                  return (
                    <tr
                      key={user.id}
                      className={selectedUserId === user.id ? 'selected' : ''}
                      onClick={() => selectUser(user.id)}
                    >
                      <td>
                        <strong>{user.username}</strong>
                        {user.admin && <span className="admin-user-badge">admin</span>}
                        {user.blocked && <span className="admin-blocked-badge">заблокирован</span>}
                        {user.unrepliedFeedbackCount > 0 && (
                          <span className="admin-pending-badge">{user.unrepliedFeedbackCount} ждут</span>
                        )}
                      </td>
                      <td>{user.feedbackCount}</td>
                      <td>{visits?.visitCount ?? 0}</td>
                      <td>{formatDate(user.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="card admin-user-detail">
            {selectedUser ? (
              <>
                <div className="admin-user-detail-head">
                  <div>
                    <h3>{selectedUser.username}</h3>
                    <p className="field-hint">
                      {selectedUser.feedbackCount} сообщений ·{' '}
                      {visitByUser.get(selectedUser.id)?.visitCount ?? 0} записей · ~
                      {formatGrams(visitByUser.get(selectedUser.id)?.totalGrams ?? 0)} всего
                    </p>
                  </div>
                  {!selectedUser.admin && (
                    <div className="admin-user-actions">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        disabled={userActionLoading}
                        onClick={() => toggleBlock(selectedUser)}
                      >
                        {selectedUser.blocked ? 'Разблокировать' : 'Заблокировать'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        disabled={userActionLoading}
                        onClick={() => setDeleteTarget(selectedUser)}
                      >
                        Удалить
                      </button>
                    </div>
                  )}
                </div>

                {!selectedUser.admin && selectedUser.blocked && selectedUser.blockComment && (
                  <div className="admin-block-comment">
                    <span className="admin-block-comment-label">Комментарий</span>
                    <p>{selectedUser.blockComment}</p>
                  </div>
                )}

                {!selectedUser.admin && (
                  <form className="admin-direct-form" onSubmit={handleDirectMessage}>
                    <label className="field">
                      <span>Написать пользователю</span>
                      <textarea
                        value={directDraft}
                        onChange={(e) => setDirectDraft(e.target.value)}
                        rows={3}
                        maxLength={2000}
                        placeholder="Сообщение появится у пользователя в колокольчике и в отзывах…"
                        required
                      />
                    </label>
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm"
                      disabled={userActionLoading || !directDraft.trim()}
                    >
                      {userActionLoading ? 'Отправка…' : 'Отправить'}
                    </button>
                  </form>
                )}

                {userFeedback.length === 0 && (
                  <p style={{ color: 'var(--text-muted)' }}>Пока нет переписки — можно написать первым.</p>
                )}

                <div className="feedback-list">
                  {userFeedback.map((item) => (
                    <div key={item.id} className="feedback-item admin-feedback-item">
                      {!item.adminInitiated && (
                        <div className="feedback-item-head">
                          <span className="feedback-meta">Отзыв · {formatDate(item.createdAt)}</span>
                        </div>
                      )}
                      {renderFeedbackItem(item)}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>Выберите пользователя в таблице слева.</p>
            )}
          </div>
        </div>
      )}

      {tab === 'feedback' && (
        <div className="card">
          <h3 style={{ marginBottom: 8 }}>Все отзывы и сообщения</h3>
          <p className="field-hint" style={{ marginBottom: 20 }}>
            На отзыв можно ответить один раз. Прямые сообщения отправляются из карточки пользователя.
          </p>
          {!loading && items.length === 0 && (
            <p style={{ color: 'var(--text-muted)' }}>Пока нет сообщений.</p>
          )}
          <div className="feedback-list admin-feedback-list">
            {items.map((item) => (
              <div key={item.id} className="feedback-item admin-feedback-item">
                <div className="feedback-item-head">
                  <strong>{item.username}</strong>
                  <span className="feedback-meta">{formatDate(item.createdAt)}</span>
                </div>
                {renderFeedbackItem(item)}
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!blockTarget}
        title={`Заблокировать «${blockTarget?.username ?? ''}»?`}
        message={
          <label className="field">
            <span>Комментарий</span>
            <textarea
              value={blockComment}
              onChange={(e) => setBlockComment(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Необязательно"
            />
          </label>
        }
        confirmLabel="Заблокировать"
        destructive
        loading={userActionLoading}
        loadingLabel="Блокировка…"
        onConfirm={confirmBlockUser}
        onCancel={() => {
          setBlockTarget(null);
          setBlockComment('');
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Удалить пользователя?"
        message={
          deleteTarget
            ? `Удалить «${deleteTarget.username}» и все его отзывы? Записи в журнале останутся в базе без привязки к аккаунту.`
            : ''
        }
        confirmLabel="Удалить"
        destructive
        loading={userActionLoading}
        onConfirm={confirmDeleteUser}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
