import { useEffect, useMemo, useRef, useState } from 'react';
import { localDateString } from '../utils';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  id?: string;
}

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const MONTHS = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
];

function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDisplay(iso: string): string {
  return parseIsoDate(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function isoFromDate(date: Date): string {
  return localDateString(date);
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

export default function DatePicker({ value, onChange, min, max, id }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(parseIsoDate(value)));
  const rootRef = useRef<HTMLDivElement>(null);

  const minDate = min ? parseIsoDate(min) : null;
  const maxDate = max ? parseIsoDate(max) : null;
  const selected = parseIsoDate(value);
  const today = parseIsoDate(localDateString());

  useEffect(() => {
    if (open) {
      setViewMonth(startOfMonth(parseIsoDate(value)));
    }
  }, [open, value]);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const cells = useMemo(() => {
    const first = startOfMonth(viewMonth);
    const startOffset = (first.getDay() + 6) % 7;
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - startOffset);

    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + i);
      const iso = isoFromDate(date);
      const outside = date.getMonth() !== viewMonth.getMonth();
      let disabled = false;
      if (minDate && date < minDate) {
        disabled = true;
      }
      if (maxDate && date > maxDate) {
        disabled = true;
      }
      return { date, iso, outside, disabled };
    });
  }, [viewMonth, minDate, maxDate]);

  function pick(iso: string) {
    onChange(iso);
    setOpen(false);
  }

  function pickToday() {
    const iso = localDateString();
    if (min && iso < min) {
      return;
    }
    if (max && iso > max) {
      return;
    }
    pick(iso);
  }

  const canGoPrev =
    !minDate ||
    addMonths(viewMonth, -1).getFullYear() > minDate.getFullYear() ||
    (addMonths(viewMonth, -1).getFullYear() === minDate.getFullYear() &&
      addMonths(viewMonth, -1).getMonth() >= minDate.getMonth());

  const canGoNext =
    !maxDate ||
    addMonths(viewMonth, 1).getFullYear() < maxDate.getFullYear() ||
    (addMonths(viewMonth, 1).getFullYear() === maxDate.getFullYear() &&
      addMonths(viewMonth, 1).getMonth() <= maxDate.getMonth());

  return (
    <div className={`date-picker ${open ? 'date-picker--open' : ''}`} ref={rootRef}>
      <button
        id={id}
        type="button"
        className="date-picker-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="date-picker-value">{formatDisplay(value)}</span>
        <span className="date-picker-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </span>
      </button>

      {open && (
        <div className="date-picker-popover" role="dialog" aria-label="Выбор даты">
          <div className="date-picker-header">
            <button
              type="button"
              className="date-picker-nav"
              disabled={!canGoPrev}
              onClick={() => setViewMonth((m) => addMonths(m, -1))}
              aria-label="Предыдущий месяц"
            >
              ‹
            </button>
            <div className="date-picker-title">
              {MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
            </div>
            <button
              type="button"
              className="date-picker-nav"
              disabled={!canGoNext}
              onClick={() => setViewMonth((m) => addMonths(m, 1))}
              aria-label="Следующий месяц"
            >
              ›
            </button>
          </div>

          <div className="date-picker-weekdays">
            {WEEKDAYS.map((day) => (
              <span key={day} className="date-picker-weekday">
                {day}
              </span>
            ))}
          </div>

          <div className="date-picker-grid">
            {cells.map(({ date, iso, outside, disabled }) => {
              const selectedDay = isSameDay(date, selected);
              const isToday = isSameDay(date, today);
              return (
                <button
                  key={iso + (outside ? '-out' : '')}
                  type="button"
                  className={[
                    'date-picker-day',
                    outside ? 'date-picker-day--outside' : '',
                    selectedDay ? 'date-picker-day--selected' : '',
                    isToday ? 'date-picker-day--today' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  disabled={disabled}
                  onClick={() => pick(iso)}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="date-picker-footer">
            <button type="button" className="date-picker-today" onClick={pickToday}>
              Сегодня
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
