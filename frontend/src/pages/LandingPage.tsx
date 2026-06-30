import { Link } from 'react-router-dom';
import AnimatedMascot from '../components/AnimatedMascot';
import AppLogo from '../components/AppLogo';
import FeatureCard from '../components/FeatureCard';
import { PrivacyIcon, StatsIcon } from '../components/FeatureIcons';

const STEPS = [
  { n: '1', title: 'Регистрация', text: 'Логин, пароль, ключевая фраза и капча.' },
  { n: '2', title: 'Отметка визита', text: 'Объём, цвет, дата.' },
  { n: '3', title: 'Статистика', text: 'День, неделя, месяц, год.' },
];

export default function LandingPage() {
  return (
    <div className="landing">
      <header className="landing-header">
        <AppLogo to="/" />
        <nav className="landing-nav" aria-label="Навигация">
          <a href="#about" className="landing-nav-link">
            О проекте
          </a>
          <a href="#features" className="landing-nav-link">
            Возможности
          </a>
          <Link to="/auth" className="btn btn-ghost landing-nav-cta">
            Войти
          </Link>
        </nav>
      </header>

      <section className="hero">
        <Link to="/auth" className="mascot-link" title="Начать трекинг">
          <AnimatedMascot size={132} />
        </Link>

        <Link to="/" className="hero-title-link">
          <h1>
            The<span>Great</span>Hike
          </h1>
        </Link>

        <p className="hero-tagline">Трекер визитов и статистики</p>

        <p className="hero-lead">
          Отмечайте визиты, смотрите сумму за период и сравнивайте объём с предметами в реальном масштабе.
        </p>

        <div className="hero-actions">
          <Link to="/auth" className="btn btn-primary">
            Начать трекинг
          </Link>
          <Link to="/auth" className="btn btn-ghost">
            Уже есть аккаунт
          </Link>
        </div>
      </section>

      <section id="about" className="landing-section landing-about">
        <h2>Что это такое</h2>
        <p>
          <strong>TheGreatHike</strong> — веб-приложение для учёта визитов. Граммы условные, для статистики
          и сравнений. Данные не передаются третьим лицам; экспорт — по запросу.
        </p>
        <ul className="landing-list">
          <li>Быстрая отметка — от «крошки» до «верзилы» или своя граммовка</li>
          <li>Журнал визитов с цветом и заметками</li>
          <li>Сравнение с человеком и предметами в масштабе</li>
          <li>Экспорт CSV по запросу</li>
        </ul>
      </section>

      <section id="features" className="landing-section">
        <h2>Возможности</h2>
        <div className="grid-2 landing-features">
          <Link to="/auth" className="landing-feature-link">
            <FeatureCard icon={<StatsIcon size={32} />} title="Статистика">
              День, неделя, месяц, год — граммы, визиты и сравнения с предметами.
            </FeatureCard>
          </Link>
          <Link to="/auth" className="landing-feature-link">
            <FeatureCard icon={<PrivacyIcon size={32} />} title="Приватность">
              Данные остаются у вас. Экспорт — только когда сами нажмёте кнопку.
            </FeatureCard>
          </Link>
        </div>
      </section>

      <section className="landing-section landing-steps">
        <h2>Как начать</h2>
        <ol className="landing-steps-list">
          {STEPS.map((step) => (
            <li key={step.n}>
              <span className="landing-step-num">{step.n}</span>
              <div>
                <strong>{step.title}</strong>
                <p>{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="hero-actions" style={{ marginTop: 28 }}>
          <Link to="/auth" className="btn btn-primary">
            Создать аккаунт
          </Link>
        </div>
      </section>

      <footer className="landing-footer">
        <AppLogo to="/" />
        <p className="landing-footer-note">Граммы условные · не медицинский прибор · 2026</p>
      </footer>
    </div>
  );
}
