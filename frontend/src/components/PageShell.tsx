import { ReactNode } from 'react';

const SIDE_TIPS = [
  'Граммы условные — для статистики',
  'Экспорт CSV — только когда сами решите',
  'Данные не уходят третьим лицам',
  'Один визит = одна запись в журнале',
];

interface PageShellProps {
  children: ReactNode;
  wide?: boolean;
  /** Справка по шкале — только в приложении после входа, не на лендинге и логине */
  showSidebar?: boolean;
}

export default function PageShell({ children, wide = false, showSidebar = false }: PageShellProps) {
  return (
    <div className="page-shell">
      <div className="page-shell-bg" aria-hidden />
      {showSidebar && (
        <aside className="page-rail page-rail--right" aria-hidden>
          <div className="rail-card">
            <h4>Шкала консистенции</h4>
            <p className="rail-card-intro">Условные граммы одного визита — выбираются при записи.</p>
            <ul>
              <li>Жидкий ~70 г</li>
              <li>Козий горох ~55 г</li>
              <li>Комочки ~110 г</li>
              <li>Сморчок ~155 г</li>
              <li>Стандарт ~200 г</li>
              <li>Мягкий ~260 г</li>
              <li>Плотный ~340 г</li>
              <li>Верзила ~500 г</li>
            </ul>
          </div>
          <div className="rail-card rail-card--tips">
            {SIDE_TIPS.map((tip) => (
              <p key={tip}>{tip}</p>
            ))}
          </div>
        </aside>
      )}
      <main className={`page ${wide ? 'page--wide' : ''}`}>{children}</main>
    </div>
  );
}
