import { ReactNode } from 'react';

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}

export default function FeatureCard({ icon, title, children }: FeatureCardProps) {
  return (
    <div className="card feature-card">
      <div className="feature-card-header">
        <div className="feature-icon-wrap">{icon}</div>
        <h3>{title}</h3>
      </div>
      <p className="feature-card-text">{children}</p>
    </div>
  );
}
