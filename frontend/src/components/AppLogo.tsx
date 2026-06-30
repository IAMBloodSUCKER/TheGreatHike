import { Link } from 'react-router-dom';

type AppLogoProps = {
  to?: string;
  className?: string;
};

export default function AppLogo({ to = '/', className = 'logo' }: AppLogoProps) {
  const content = (
    <>
      <img src="/logo.png" alt="" width={32} className="logo-mark" aria-hidden="true" />
      <span className="logo-text">
        The<span>Great</span>Hike
      </span>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={className} title="На главную" aria-label="TheGreatHike — на главную">
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
