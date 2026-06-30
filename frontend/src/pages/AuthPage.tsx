import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppLogo from '../components/AppLogo';
import { api, UserGender } from '../api';
import { readRememberPreference } from '../authStorage';
import CaptchaField from '../components/CaptchaField';
import { HumanFigureSvg } from '../components/HumanFigure';
import { useCaptcha } from '../hooks/useCaptcha';
import { useAuth } from '../hooks/useAuth';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register' | 'recover'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [recoveryKey, setRecoveryKey] = useState('');
  const [recoveryKeyConfirm, setRecoveryKeyConfirm] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [rememberMe, setRememberMe] = useState(readRememberPreference);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [gender, setGender] = useState<UserGender>('MALE');
  const [termsText, setTermsText] = useState('');
  const [error, setError] = useState('');
  const [usernameHint, setUsernameHint] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [loading, setLoading] = useState(false);
  const { captcha, refresh, error: captchaError } = useCaptcha();
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate('/app', { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    api.getTerms().then((t) => setTermsText(t.content)).catch(() => {});
  }, []);

  useEffect(() => {
    if (mode !== 'register') {
      setUsernameStatus('idle');
      return;
    }
    const loginName = normalizeUsername(username);
    if (loginName.length < 3) {
      setUsernameStatus('idle');
      return;
    }

    setUsernameStatus('checking');
    const timer = window.setTimeout(() => {
      api
        .isUsernameAvailable(loginName)
        .then((available) => setUsernameStatus(available ? 'available' : 'taken'))
        .catch(() => setUsernameStatus('idle'));
    }, 400);

    return () => window.clearTimeout(timer);
  }, [mode, username]);

  function normalizeUsername(value: string): string {
    return value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 64);
  }

  function handleUsernameChange(raw: string) {
    const normalized = normalizeUsername(raw);
    setUsername(normalized);
    if (raw !== normalized && raw.length > 0) {
      setUsernameHint('Логин — только латинские буквы (a–z), цифры и _. Кириллица не подходит. Пример: ivan или admin');
    } else if (normalized.length > 0 && normalized.length < 3) {
      setUsernameHint(`Минимум 3 символа — осталось ${3 - normalized.length}`);
    } else {
      setUsernameHint('');
    }
  }

  function validateRecoveryKeyFormat(key: string): string | null {
    if (!key.trim()) {
      return 'Укажите ключевую фразу';
    }
    if (key.length < 8) {
      return 'Ключевая фраза: минимум 8 символов';
    }
    if (!/[A-Za-zА-Яа-яЁё]/.test(key) || !/\d/.test(key)) {
      return 'В ключевой фразе должны быть и буквы, и цифры';
    }
    return null;
  }

  function validateRecoveryKey(key: string, loginName: string): string | null {
    const formatError = validateRecoveryKeyFormat(key);
    if (formatError) {
      return formatError;
    }
    if (key === loginName || key === password) {
      return 'Ключевая фраза не должна совпадать с логином или паролем';
    }
    return null;
  }

  function switchMode(next: 'login' | 'register' | 'recover') {
    setMode(next);
    setError('');
    setUsernameHint('');
    setUsernameStatus('idle');
    setPassword('');
    setRecoveryKey('');
    setRecoveryKeyConfirm('');
    setNewPasswordConfirm('');
    setCaptchaAnswer('');
    refresh();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    const loginName = normalizeUsername(username);
    if (loginName.length < 3) {
      setError(
        loginName.length === 0
          ? 'Придумайте логин латинскими буквами (a–z), цифрами или _ — минимум 3 символа. Пример: ivan_petrov'
          : 'Логин слишком короткий — нужно минимум 3 символа',
      );
      return;
    }
    if (password.length === 0) {
      setError(mode === 'recover' ? 'Введите новый пароль' : 'Введите пароль');
      return;
    }
    if ((mode === 'register' || mode === 'recover') && password.length < 6) {
      setError('Пароль слишком короткий — нужно минимум 6 символов');
      return;
    }
    if (mode === 'register' && password === loginName) {
      setError('Пароль не должен совпадать с логином');
      return;
    }
    if (mode === 'register' && usernameStatus === 'taken') {
      setError('Такой логин уже занят');
      return;
    }
    if (mode === 'register') {
      const recoveryError = validateRecoveryKey(recoveryKey, loginName);
      if (recoveryError) {
        setError(recoveryError);
        return;
      }
      if (recoveryKey !== recoveryKeyConfirm) {
        setError('Ключевые фразы не совпадают');
        return;
      }
    }
    if (mode === 'recover') {
      const recoveryFormatError = validateRecoveryKeyFormat(recoveryKey);
      if (recoveryFormatError) {
        setError(recoveryFormatError);
        return;
      }
      if (password === loginName || password === recoveryKey) {
        setError('Новый пароль не должен совпадать с логином или ключевой фразой');
        return;
      }
      if (password !== newPasswordConfirm) {
        setError('Пароли не совпадают');
        return;
      }
    }
    if (!captchaAnswer.trim()) {
      setError('Введите ответ на пример в капче');
      return;
    }
    if (mode === 'register' && !termsAccepted) {
      setError('Чтобы зарегистрироваться, отметьте согласие с условиями');
      return;
    }
    if (!captcha) {
      setError('Подождите загрузки капчи');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        username: loginName,
        password,
        captchaId: captcha.captchaId,
        captchaAnswer,
      };
      const res =
        mode === 'login'
          ? await api.login({ ...payload, rememberMe })
          : mode === 'recover'
            ? await api.recoverPassword({
                username: loginName,
                recoveryKey,
                newPassword: password,
                captchaId: captcha.captchaId,
                captchaAnswer,
                rememberMe,
              })
            : await api.register({ ...payload, recoveryKey, termsAccepted, gender });
      login(
        res.token,
        res.username,
        res.admin,
        mode === 'register' ? gender : undefined,
        mode === 'login' || mode === 'recover' ? rememberMe : true,
      );
      navigate('/app');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
      refresh();
      setCaptchaAnswer('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-header">
        <AppLogo to="/" />
        <Link to="/" className="auth-home-link">
          ← На главную
        </Link>
      </div>

      <div className="card">
        {mode === 'recover' ? (
          <div className="auth-recover-head">
            <h2 className="auth-recover-title">Восстановление доступа</h2>
            <button type="button" className="btn btn-ghost auth-back-link" onClick={() => switchMode('login')}>
              ← Ко входу
            </button>
          </div>
        ) : (
          <div className="tabs">
            <button
              type="button"
              className={`tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => switchMode('login')}
            >
              Вход
            </button>
            <button
              type="button"
              className={`tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => switchMode('register')}
            >
              Регистрация
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label>Логин</label>
            <input
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              maxLength={64}
              autoComplete="username"
              spellCheck={false}
              aria-describedby="username-rules"
            />
            <span id="username-rules" className="field-hint">
              Латинские буквы <strong>a–z</strong>, цифры <strong>0–9</strong> и <strong>_</strong>, от{' '}
              <strong>3</strong> символов. Пример: <strong>ivan_petrov</strong>
            </span>
            {usernameHint && <p className="field-warning">{usernameHint}</p>}
            {mode === 'register' && usernameStatus === 'checking' && (
              <p className="field-hint">Проверяем логин…</p>
            )}
            {mode === 'register' && usernameStatus === 'available' && (
              <p className="field-success">Логин свободен</p>
            )}
            {mode === 'register' && usernameStatus === 'taken' && (
              <p className="field-warning">Такой логин уже занят</p>
            )}
          </div>
          {mode === 'recover' && (
            <div className="field">
              <label>Ключевая фраза</label>
              <input
                type="password"
                value={recoveryKey}
                onChange={(e) => setRecoveryKey(e.target.value)}
                autoComplete="off"
                maxLength={128}
              />
              <span className="field-hint">
                Та же фраза, которую вы задали при регистрации
              </span>
            </div>
          )}

          <div className="field">
            <label>{mode === 'recover' ? 'Новый пароль' : 'Пароль'}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
            <span className="field-hint">
              {mode === 'login'
                ? 'Пароль от вашей учётной записи'
                : 'Не короче 6 символов и не совпадает с логином'}
            </span>
            {mode === 'login' && (
              <button
                type="button"
                className="auth-forgot-link"
                onClick={() => switchMode('recover')}
              >
                Забыли пароль? Восстановить по ключевой фразе
              </button>
            )}
          </div>

          {mode === 'recover' && (
            <div className="field">
              <label>Повторите новый пароль</label>
              <input
                type="password"
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          )}

          {mode === 'login' || mode === 'recover' ? (
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Запомнить меня</span>
            </label>
          ) : null}

          {mode === 'register' && (
            <>
              <div className="field">
                <label>Ключевая фраза</label>
                <input
                  type="password"
                  value={recoveryKey}
                  onChange={(e) => setRecoveryKey(e.target.value)}
                  autoComplete="new-password"
                  maxLength={128}
                />
                <span className="field-hint">
                  От 8 символов, буквы и цифры. Не совпадает с логином и паролем. Запишите — для восстановления пароля.
                </span>
              </div>
              <div className="field">
                <label>Повторите ключевую фразу</label>
                <input
                  type="password"
                  value={recoveryKeyConfirm}
                  onChange={(e) => setRecoveryKeyConfirm(e.target.value)}
                  autoComplete="new-password"
                  maxLength={128}
                />
              </div>
            </>
          )}

          {mode === 'register' && (
            <div className="field">
              <label>Пол</label>
              <div className="gender-picker" role="radiogroup" aria-label="Выбор пола">
                <button
                  type="button"
                  role="radio"
                  aria-checked={gender === 'MALE'}
                  className={`gender-option ${gender === 'MALE' ? 'active' : ''}`}
                  onClick={() => setGender('MALE')}
                >
                  <HumanFigureSvg gender="MALE" className="gender-option-figure" />
                  <span>Мужской</span>
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={gender === 'FEMALE'}
                  className={`gender-option ${gender === 'FEMALE' ? 'active' : ''}`}
                  onClick={() => setGender('FEMALE')}
                >
                  <HumanFigureSvg gender="FEMALE" className="gender-option-figure" />
                  <span>Женский</span>
                </button>
              </div>
              <span className="field-hint">Фигурка человека в сравнениях объёма будет соответствовать выбору</span>
            </div>
          )}

          <CaptchaField
            imageBase64={captcha?.imageBase64}
            value={captchaAnswer}
            onChange={setCaptchaAnswer}
            onRefresh={refresh}
            loading={!captcha && !captchaError}
            error={captchaError}
          />

          {mode === 'register' && (
            <>
              <p style={{ fontWeight: 600, marginBottom: 8 }}>Пользовательское соглашение</p>
              <div className="terms-box">{termsText}</div>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                />
                <span>Я прочитал(а) и принимаю условия использования TheGreatHike</span>
              </label>
            </>
          )}

          {error && <p className="error">{error}</p>}

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading
              ? 'Загрузка…'
              : mode === 'login'
                ? 'Войти'
                : mode === 'recover'
                  ? 'Сменить пароль и войти'
                  : 'Зарегистрироваться'}
          </button>
        </form>
      </div>
    </div>
  );
}
