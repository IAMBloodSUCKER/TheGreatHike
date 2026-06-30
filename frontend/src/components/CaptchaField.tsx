interface Props {
  captchaId?: string;
  imageBase64?: string;
  value: string;
  onChange: (v: string) => void;
  onRefresh: () => void;
  loading?: boolean;
  error?: string;
}

export default function CaptchaField({
  imageBase64,
  value,
  onChange,
  onRefresh,
  loading,
  error,
}: Props) {
  return (
    <div className="field">
      <label>Капча</label>
      <div className="captcha-row">
        {imageBase64 ? (
          <img
            className="captcha-img"
            src={`data:image/png;base64,${imageBase64}`}
            alt="Капча"
          />
        ) : (
          <div className="captcha-placeholder" aria-hidden>
            {loading ? 'Загрузка…' : 'Нет изображения'}
          </div>
        )}
        <button type="button" className="btn btn-ghost" onClick={onRefresh} disabled={loading}>
          ↻ Обновить
        </button>
      </div>
      {error && <p className="error captcha-error">{error}</p>}
      <input
        type="text"
        placeholder="Ответ на пример"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
      />
    </div>
  );
}
