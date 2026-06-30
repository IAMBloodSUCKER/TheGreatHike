import { useCallback, useState } from 'react';

const BUBBLES = ['Поехали!', 'Улыбнись!', 'Great hike!', '💩', 'Ещё один поход?'];

type AnimatedMascotProps = {
  className?: string;
  size?: number;
};

export default function AnimatedMascot({ className = '', size = 128 }: AnimatedMascotProps) {
  const [bubble, setBubble] = useState<string | null>(null);
  const [hop, setHop] = useState(false);

  const react = useCallback(() => {
    setHop(true);
    setBubble(BUBBLES[Math.floor(Math.random() * BUBBLES.length)]);
    window.setTimeout(() => setBubble(null), 1800);
  }, []);

  return (
    <div
      className={`mascot ${hop ? 'mascot--hop' : ''} ${className}`.trim()}
      onAnimationEnd={(e) => {
        if (e.animationName.includes('mascot-hop')) {
          setHop(false);
        }
      }}
    >
      <div className="mascot-glow" aria-hidden="true" />
      <img
        src="/logo.png"
        alt="Эмблема TheGreatHike — улыбающаяся какашка"
        width={size}
        className="mascot-img"
        draggable={false}
      />
      <span className="mascot-blush mascot-blush--left" aria-hidden="true" />
      <span className="mascot-blush mascot-blush--right" aria-hidden="true" />
      {bubble && (
        <span className="mascot-bubble" role="status">
          {bubble}
        </span>
      )}
      <button
        type="button"
        className="mascot-tap"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          react();
        }}
        aria-label="Погладить маскота"
      >
        <span aria-hidden="true">👋</span>
      </button>
    </div>
  );
}
