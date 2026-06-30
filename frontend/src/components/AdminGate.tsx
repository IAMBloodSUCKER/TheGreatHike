import { FormEvent, useState } from 'react';
import AppLogo from './AppLogo';
import { api } from '../api';
import AppHomeLink from './AppHomeLink';
import CaptchaField from './CaptchaField';
import { useCaptcha } from '../hooks/useCaptcha';

interface AdminGateProps {
  onUnlocked: (adminSessionToken: string) => void;
}

export default function AdminGate({ onUnlocked }: AdminGateProps) {
  const { captcha, refresh, loading: captchaLoading, error: captchaError } = useCaptcha();
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [adminSecret, setAdminSecret] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!captcha) {
      setError('Подождите загрузки капчи');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await api.unlockAdmin({
        captchaId: captcha.captchaId,
        captchaAnswer,
        adminSecret,
      });
      onUnlocked(res.adminSessionToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
      refresh();
      setCaptchaAnswer('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="admin-gate-wrap">
      <div className="header-bar">
        <AppLogo to="/app" />
      </div>

      <div className="card admin-gate-card">
        <h3 style={{ marginBottom: 8 }}>Вход в админку</h3>
        <p className="field-hint" style={{ marginBottom: 20 }}>
          Для доступа нужны капча и секретный ключ администратора. Подтверждение запрашивается при
          каждом входе в этот раздел.
        </p>

        <form onSubmit={handleSubmit}>
          <CaptchaField
            captchaId={captcha?.captchaId}
            imageBase64={captcha?.imageBase64}
            value={captchaAnswer}
            onChange={setCaptchaAnswer}
            onRefresh={refresh}
            loading={captchaLoading && !captchaError}
            error={captchaError}
          />

          <div className="field">
            <label>Секретный ключ админки</label>
            <input
              type="password"
              value={adminSecret}
              onChange={(e) => setAdminSecret(e.target.value)}
              autoComplete="off"
              placeholder="ADMIN_SECRET_KEY из настроек сервера"
              required
            />
            <span className="field-hint">
              Должен совпадать с <code>ADMIN_SECRET_KEY</code> в файле <code>.env</code> на сервере. После
              смены ключа перезапустите контейнеры: <code>docker compose up -d --build</code>.
            </span>
          </div>

          {error && <p className="error">{error}</p>}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Проверка…' : 'Войти в админку'}
            </button>
            <AppHomeLink />
          </div>
        </form>
      </div>
    </div>
  );
}
