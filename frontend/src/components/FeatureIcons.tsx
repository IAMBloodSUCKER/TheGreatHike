interface IconProps {
  size?: number;
  className?: string;
}

export function StatsIcon({ size = 28, className }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect x="2" y="2" width="28" height="28" rx="8" fill="url(#stats-bg)" />
      <rect x="8" y="18" width="4" height="8" rx="2" fill="#4ade80" />
      <rect x="14" y="13" width="4" height="13" rx="2" fill="#e8a838" />
      <rect x="20" y="8" width="4" height="18" rx="2" fill="#60a5fa" />
      <defs>
        <linearGradient id="stats-bg" x1="2" y1="2" x2="30" y2="30">
          <stop stopColor="rgba(232,168,56,0.2)" />
          <stop offset="1" stopColor="rgba(96,165,250,0.12)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function PrivacyIcon({ size = 28, className }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect x="2" y="2" width="28" height="28" rx="8" fill="url(#privacy-bg)" />
      <path
        d="M16 7l9 4v6c0 5.5-3.8 10.6-9 12-5.2-1.4-9-6.5-9-12v-6l9-4z"
        fill="url(#shield)"
        stroke="#e8a838"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M12.5 16l2.2 2.2L19.5 13"
        stroke="#1a222d"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="privacy-bg" x1="2" y1="2" x2="30" y2="30">
          <stop stopColor="rgba(232,168,56,0.18)" />
          <stop offset="1" stopColor="rgba(74,222,128,0.1)" />
        </linearGradient>
        <linearGradient id="shield" x1="16" y1="7" x2="16" y2="29">
          <stop stopColor="#f0c050" />
          <stop offset="1" stopColor="#d4922a" />
        </linearGradient>
      </defs>
    </svg>
  );
}
