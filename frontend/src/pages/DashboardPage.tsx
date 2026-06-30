import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLogo from '../components/AppLogo';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api, ConsistencyLevel, Dashboard, StoolColor, Visit } from '../api';
import ConfirmDialog from '../components/ConfirmDialog';
import ComparisonChip from '../components/ComparisonChip';
import DatePicker from '../components/DatePicker';
import FeedbackHint from '../components/FeedbackHint';
import NotificationBell from '../components/NotificationBell';
import VolumeVisualizer from '../components/VolumeVisualizer';
import { useAuth } from '../hooks/useAuth';
import { safeEmoji } from '../emoji';
import {
  formatDate,
  formatGrams,
  localDateDaysAgo,
  localDateString,
  PERIOD_LABELS,
  tierImage,
  visitGrams,
} from '../utils';

export default function DashboardPage() {
  const { username, logout, isAdmin } = useAuth();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [consistency, setConsistency] = useState<ConsistencyLevel>('NORMAL');
  const [customGramsInput, setCustomGramsInput] = useState('200');
  const [stoolColor, setStoolColor] = useState<StoolColor>('BROWN');
  const [visitDate, setVisitDate] = useState(localDateString);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [visitToDelete, setVisitToDelete] = useState<Visit | null>(null);
  const [volumePeriod, setVolumePeriod] = useState<{
    grams: number;
    periodLabel: string;
    compareSeed: string;
  } | null>(null);

  const refreshDashboard = useCallback(async () => {
    const data = await api.getDashboard();
    setDashboard(data);
    return data;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await refreshDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [refreshDashboard]);

  useEffect(() => {
    load();
  }, [load]);

  function parseCustomGrams(): number {
    const n = parseInt(customGramsInput, 10);
    return Number.isFinite(n) ? n : 0;
  }

  function normalizeCustomGramsInput() {
    let n = parseInt(customGramsInput, 10);
    if (!Number.isFinite(n) || n < 10) {
      n = 10;
    } else if (n > 5000) {
      n = 5000;
    }
    setCustomGramsInput(String(n));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    setSuccess('');
    try {
      const customGrams = consistency === 'CUSTOM' ? parseCustomGrams() : undefined;
      if (consistency === 'CUSTOM' && (customGrams === undefined || customGrams < 10 || customGrams > 5000)) {
        setFormError('Укажите массу от 10 до 5000 г');
        return;
      }
      const created = await api.createVisit({
        count: 1,
        consistency,
        customGramsPerUnit: customGrams,
        color: stoolColor,
        visitDate,
        note: note || undefined,
      });
      setNote('');
      setVisitDate(localDateString());
      setSuccess('Визит записан! 💩');
      try {
        await refreshDashboard();
      } catch (reloadErr) {
        setDashboard((prev) =>
          prev
            ? {
                ...prev,
                recentVisits: [created, ...prev.recentVisits.filter((v) => v.id !== created.id)].slice(0, 20),
              }
            : prev,
        );
        setFormError(
          reloadErr instanceof Error
            ? `Запись сохранена, но не удалось обновить статистику: ${reloadErr.message}`
            : 'Запись сохранена, но не удалось обновить статистику',
        );
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!visitToDelete) {
      return;
    }
    const visitId = visitToDelete.id;
    setDeletingId(visitId);
    setError('');
    setSuccess('');
    try {
      await api.deleteVisit(visitId);
      setSuccess('Запись удалена');
      setVisitToDelete(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления');
    } finally {
      setDeletingId(null);
    }
  }

  async function handleExport() {
    setError('');
    try {
      const blob = await api.exportCsv();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'thegreathike-export.csv';
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка экспорта');
    }
  }

  const chartData =
    dashboard?.periods.map((p) => ({
      name: PERIOD_LABELS[p.period] ?? p.period,
      grams: p.totalGrams,
    })) ?? [];

  const customGrams = consistency === 'CUSTOM' ? parseCustomGrams() : 0;
  const entryGrams = dashboard ? visitGrams(consistency, customGrams || '', dashboard.consistencyLevels) : 0;

  const PERIOD_COMPARE_COLOR = '#8B5E3C';

  return (
    <>
      <div className="header-bar">
        <AppLogo to="/" />
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)' }}>Привет, {username}</span>
          <NotificationBell />
          <Link to="/app/feedback" className="btn btn-ghost">
            Отзыв
          </Link>
          {isAdmin && (
            <Link to="/app/admin" className="btn btn-admin">
              Админка
            </Link>
          )}
          <button type="button" className="btn btn-ghost" onClick={handleExport}>
            Экспорт CSV
          </button>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Выйти
          </button>
        </div>
      </div>

      {loading && <p style={{ color: 'var(--text-muted)' }}>Загрузка…</p>}
      {error && <p className="error">{error}</p>}

      {dashboard && (
        <>
          <FeedbackHint />

          <div className="grid-stats" style={{ marginBottom: 24 }}>
            {dashboard.periods.map((p) => (
              <div key={p.period} className="card stat-card">
                <div className="stat-period">{PERIOD_LABELS[p.period]}</div>
                <div className="stat-grams">{formatGrams(p.totalGrams)}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 10 }}>
                  {p.totalVisits} визитов
                </div>
                <button
                  type="button"
                  className="btn stat-compare-btn"
                  disabled={p.totalGrams <= 0}
                  onClick={() =>
                    setVolumePeriod({
                      grams: p.totalGrams,
                      periodLabel: PERIOD_LABELS[p.period] ?? p.period,
                      compareSeed: p.period,
                    })
                  }
                >
                  Сравнить с человеком
                </button>
                <div className="fun-fact">
                  <div className="fun-fact-title">
                    <span className="fun-emoji" aria-hidden="true">
                      {safeEmoji(p.funFact.emoji)}
                    </span>{' '}
                    {p.funFact.text}
                  </div>
                  {p.funFact.comparisons?.length > 0 && (
                    <div className="fun-fact-chips">
                      {p.funFact.comparisons.map((line) => (
                        <ComparisonChip key={line} line={line} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 16 }}>График по периодам</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                  }}
                  formatter={(v: number) => [`${formatGrams(v)}`, 'Масса']}
                />
                <Bar dataKey="grams" fill="var(--accent)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid-2">
            <div className="card">
              <h3 style={{ marginBottom: 16 }}>Отметить визит</h3>
              <form onSubmit={handleSubmit} noValidate>
                <div className="field">
                  <label htmlFor="visit-date">
                    День визита
                  </label>
                  <DatePicker
                    id="visit-date"
                    value={visitDate}
                    onChange={setVisitDate}
                    min={localDateDaysAgo(365)}
                    max={localDateString()}
                  />
                  <span className="field-hint">
                    Одна запись = один визит в туалет. Можно добавить за сегодня или за прошлые дни (до года назад).
                  </span>
                </div>

                <div className="field">
                  <label>Консистенция</label>
                  <span className="field-hint" style={{ marginBottom: 10 }}>
                    Тип стула по шкале Бристоля. Граммы условные — для статистики и сравнений.
                  </span>
                  <div className="tier-grid">
                    {dashboard.consistencyLevels.map((tier) => (
                      <button
                        key={tier.level}
                        type="button"
                        className={`tier-btn ${consistency === tier.level ? 'selected' : ''}`}
                        onClick={() => setConsistency(tier.level)}
                      >
                        <img src={tierImage(tier.imageKey)} alt={tier.label} />
                        <span className="tier-label">{tier.label}</span>
                        {tier.level !== 'CUSTOM' && (
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                            ~{tier.gramsPerUnit} г
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {consistency === 'CUSTOM' && (
                  <div className="field">
                    <label>Своя граммовка</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="input-plain-number"
                      value={customGramsInput}
                      onChange={(e) => setCustomGramsInput(e.target.value.replace(/\D/g, ''))}
                      onFocus={(e) => e.target.select()}
                      onBlur={normalizeCustomGramsInput}
                      required
                    />
                    <span className="field-hint">От 10 до 5000 г, если ни один тип не подошёл</span>
                  </div>
                )}

                <div className="field">
                  <label>Цвет</label>
                  <div className="color-grid">
                    {dashboard.stoolColors.map((c) => (
                      <button
                        key={c.color}
                        type="button"
                        className={`color-btn ${stoolColor === c.color ? 'selected' : ''}`}
                        title={c.label}
                        onClick={() => setStoolColor(c.color)}
                      >
                        <span className="color-swatch" style={{ background: c.hex }} />
                        <span className="color-label">{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="visit-preview">
                  <strong>Масса этого визита:</strong> ~{formatGrams(entryGrams)}
                  {consistency === 'CUSTOM' ? (
                    <span> (своя граммовка)</span>
                  ) : (
                    <span>
                      {' '}
                      («{dashboard.consistencyLevels.find((t) => t.level === consistency)?.label}»)
                    </span>
                  )}
                </div>

                <div className="field">
                  <label>Заметка (необязательно)</label>
                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={256}
                    placeholder="Например: после кофе"
                  />
                </div>

                {formError && <p className="error">{formError}</p>}
                {success && <p style={{ color: 'var(--success)', marginBottom: 12 }}>{success}</p>}

                <button type="submit" className="btn btn-primary" disabled={saving || entryGrams <= 0}>
                  {saving ? 'Сохранение…' : 'Записать визит'}
                </button>
              </form>
            </div>

            <div className="card">
              <h3 style={{ marginBottom: 16 }}>Недавние визиты</h3>
              <div className="visit-list">
                {dashboard.recentVisits.length === 0 && (
                  <p style={{ color: 'var(--text-muted)' }}>Пока пусто — время первого похода!</p>
                )}
                {dashboard.recentVisits.map((v) => (
                  <div key={v.id} className="visit-item">
                    <img src={tierImage(v.imageKey)} alt={v.consistencyLabel} />
                    <div className="visit-meta">
                      <strong>{v.consistencyLabel}</strong>
                      <span>
                        <span className="color-dot" style={{ background: v.colorHex }} title={v.colorLabel} />
                        {formatGrams(v.totalGrams)} · {v.colorLabel} · {formatDate(v.visitedAt)}
                        {v.note ? ` · ${v.note}` : ''}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost btn-delete"
                      title="Удалить запись"
                      disabled={deletingId === v.id}
                      onClick={() => setVisitToDelete(v)}
                    >
                      {deletingId === v.id ? '…' : '✕'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        open={visitToDelete !== null}
        title="Удалить запись?"
        destructive
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        loading={visitToDelete !== null && deletingId === visitToDelete.id}
        onCancel={() => {
          if (!deletingId) {
            setVisitToDelete(null);
          }
        }}
        onConfirm={confirmDelete}
        message={
          visitToDelete && (
            <>
              <p className="modal-text">Эта запись о походе будет удалена безвозвратно.</p>
              <div className="modal-visit-preview">
                <img src={tierImage(visitToDelete.imageKey)} alt={visitToDelete.consistencyLabel} />
                <div>
                  <strong>{visitToDelete.consistencyLabel}</strong>
                  <span>
                    <span className="color-dot" style={{ background: visitToDelete.colorHex }} />
                    {formatGrams(visitToDelete.totalGrams)} · {visitToDelete.colorLabel} ·{' '}
                    {formatDate(visitToDelete.visitedAt)}
                    {visitToDelete.note ? ` · ${visitToDelete.note}` : ''}
                  </span>
                </div>
              </div>
            </>
          )
        }
      />

      <VolumeVisualizer
        open={volumePeriod !== null}
        grams={volumePeriod?.grams ?? 0}
        colorHex={PERIOD_COMPARE_COLOR}
        periodLabel={volumePeriod?.periodLabel}
        compareSeed={volumePeriod?.compareSeed}
        onClose={() => setVolumePeriod(null)}
      />
    </>
  );
}
