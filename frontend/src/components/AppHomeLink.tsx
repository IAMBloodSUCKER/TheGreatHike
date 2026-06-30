import { Link } from 'react-router-dom';

export default function AppHomeLink() {
  return (
    <Link to="/app" className="btn btn-home" title="Записать визит, посмотреть статистику и сравнения">
      <span className="btn-home-icon" aria-hidden="true">
        ←
      </span>
      <span className="btn-home-label">
        <span className="btn-home-title">Журнал визитов</span>
        <span className="btn-home-sub">Запись и статистика</span>
      </span>
    </Link>
  );
}
