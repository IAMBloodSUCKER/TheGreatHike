import { useState } from 'react';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 'tgh-feedback-hint-dismissed';

export default function FeedbackHint() {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(STORAGE_KEY) === '1',
  );

  if (dismissed) {
    return null;
  }

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1');
    setDismissed(true);
  }

  return (
    <div className="feedback-hint" role="note">
      <div className="feedback-hint-body">
        <strong>Есть идея или пожелание?</strong>
        <p>
          Оставьте отзыв — мы читаем каждый. Подскажите, чего не хватает, или что можно улучшить в
          TheGreatHike.
        </p>
        <div className="feedback-hint-actions">
          <Link to="/app/feedback" className="btn btn-primary btn-sm">
            Написать отзыв
          </Link>
          <button type="button" className="btn btn-ghost btn-sm" onClick={dismiss}>
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
}
