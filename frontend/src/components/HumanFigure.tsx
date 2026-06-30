export type UserGender = 'MALE' | 'FEMALE';

const SKIN = '#f0c9a8';
const SKIN_SHADOW = '#e8b898';

interface HumanFigureProps {
  cx: number;
  groundY: number;
  height?: number;
  gender?: UserGender;
}

interface HumanFigureSvgProps {
  gender?: UserGender;
  className?: string;
}

/** Мужчина — плоский стиль: чёлка, белая футболка, длинные ноги */
function MaleBody() {
  return (
    <>
      <path d="M 33 56 L 30 106 L 37 106 L 40 56 Z" fill="#8d99a5" />
      <path d="M 47 56 L 50 106 L 43 106 L 40 56 Z" fill="#8d99a5" />
      <path d="M 28 106 L 27 113 L 39 113 L 40 106 Z" fill="#1c1c1c" />
      <path d="M 52 106 L 53 113 L 41 113 L 40 106 Z" fill="#1c1c1c" />

      <path d="M 27 40 Q 40 36 53 40 L 51 56 L 29 56 Z" fill="#f5f5f5" />
      <path d="M 29 42 L 27 44 L 27 52 Q 40 50 53 52 L 53 44 L 51 42 Q 40 40 29 42 Z" fill="#e8e8e8" opacity="0.5" />

      <rect x="17" y="42" width="8" height="30" rx="4" fill={SKIN} />
      <rect x="55" y="42" width="8" height="30" rx="4" fill={SKIN} />

      {/* Голова */}
      <circle cx="40" cy="26" r="14" fill={SKIN} />

      {/* Волосы поверх головы: макушка + бока + чёлка */}
      <path
        d="M 26 28
           C 26 14 33 9 40 9
           C 47 9 54 14 54 28
           L 52 31
           Q 40 24 28 31
           Z"
        fill="#5a3d24"
      />
      <path
        d="M 28 20
           Q 40 16 52 20
           L 50 24
           Q 40 21 30 24
           Z"
        fill="#4a3220"
      />
      <path
        d="M 36 10
           Q 46 6 58 11
           L 55 19
           Q 46 14 38 16
           Z"
        fill="#6b4a2e"
      />
      <path d="M 26 24 L 24 34 L 28 32 Z" fill="#5a3d24" />
      <path d="M 54 24 L 56 34 L 52 32 Z" fill="#5a3d24" />

      {/* Лицо поверх волос */}
      <circle cx="34" cy="27" r="1.7" fill="#141414" />
      <circle cx="46" cy="27" r="1.7" fill="#141414" />
      <path
        d="M 33 32 Q 40 35 47 32"
        stroke="#141414"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
      <ellipse cx="40" cy="24" rx="12" ry="11" fill={SKIN_SHADOW} opacity="0.12" />
    </>
  );
}

/** Женщина — тот же стиль: каре, блуза и юбка, длинные ноги */
function FemaleBody() {
  return (
    <>
      <path d="M 33 66 L 30 106 L 37 106 L 40 66 Z" fill="#8d99a5" />
      <path d="M 47 66 L 50 106 L 43 106 L 40 66 Z" fill="#8d99a5" />
      <path d="M 28 106 L 27 112 L 39 112 L 40 106 Z" fill="#c9a06a" />
      <path d="M 52 106 L 53 112 L 41 112 L 40 106 Z" fill="#c9a06a" />

      <path d="M 25 60 L 19 68 Q 40 76 61 68 L 55 60 Z" fill="#a8b5c0" />
      <path d="M 28 42 L 28 60 L 52 60 L 52 42 Q 40 38 28 42 Z" fill="#b8c5cf" />
      <path d="M 30 44 L 30 48 L 50 48 L 50 44 Q 40 42 30 44 Z" fill="#c8d4dc" opacity="0.55" />

      <rect x="18" y="44" width="7" height="28" rx="3.5" fill={SKIN} />
      <rect x="55" y="44" width="7" height="28" rx="3.5" fill={SKIN} />

      {/* Голова */}
      <circle cx="40" cy="28" r="13" fill={SKIN} />

      {/* Волосы: шапка на макушке, чёлка, пряди по бокам */}
      <path
        d="M 25 30
           C 25 14 32 10 40 10
           C 48 10 55 14 55 30
           L 53 33
           Q 40 27 27 33
           Z"
        fill="#4a3728"
      />
      <path
        d="M 28 22
           Q 40 18 52 22
           L 50 26
           Q 40 23 30 26
           Z"
        fill="#3d2e22"
      />
      <path d="M 25 26 L 21 46 L 27 46 L 29 30 Z" fill="#4a3728" />
      <path d="M 55 26 L 59 46 L 53 46 L 51 30 Z" fill="#4a3728" />
      <path d="M 21 38 Q 23 48 27 50 L 29 44 Q 26 42 25 34 Z" fill="#3d2e22" />
      <path d="M 59 38 Q 57 48 53 50 L 51 44 Q 54 42 55 34 Z" fill="#3d2e22" />

      {/* Лицо поверх волос */}
      <circle cx="34" cy="29" r="1.6" fill="#141414" />
      <circle cx="46" cy="29" r="1.6" fill="#141414" />
      <path
        d="M 33 34 Q 40 37 47 34"
        stroke="#141414"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      <ellipse cx="40" cy="26" rx="11" ry="10" fill={SKIN_SHADOW} opacity="0.1" />
    </>
  );
}

export function HumanFigureSvg({ gender = 'MALE', className }: HumanFigureSvgProps) {
  return (
    <svg viewBox="0 0 80 120" className={className} aria-hidden="true">
      <ellipse cx="40" cy="116" rx="20" ry="3" fill="#000" opacity="0.12" />
      {gender === 'FEMALE' ? <FemaleBody /> : <MaleBody />}
    </svg>
  );
}

export default function HumanFigure({ cx, groundY, height = 138, gender = 'MALE' }: HumanFigureProps) {
  const top = groundY - height;
  const scale = height / 120;

  return (
    <g transform={`translate(${cx}, ${top})`}>
      <g transform={`translate(-40, 0) scale(${scale})`}>
        <ellipse cx="40" cy="116" rx="20" ry="3" fill="#000" opacity="0.12" />
        {gender === 'FEMALE' ? <FemaleBody /> : <MaleBody />}
      </g>
    </g>
  );
}

export function humanGenderLabel(gender: UserGender): string {
  return gender === 'FEMALE' ? 'взрослая' : 'взрослый';
}
