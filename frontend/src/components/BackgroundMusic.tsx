import { useCallback, useEffect, useRef, useState } from 'react';

const ENABLED_KEY = 'tgh-music-enabled';
const VOLUME_KEY = 'tgh-music-volume';
const MUSIC_SRC = '/audio/whimsical-weather-waltz.mp3';
const DEFAULT_VOLUME = 0.14;

function readEnabled(): boolean {
  try {
    const raw = localStorage.getItem(ENABLED_KEY);
    // По умолчанию включено; выключается только явным выбором пользователя
    if (raw === '0') {
      return false;
    }
    return true;
  } catch {
    return true;
  }
}

function readVolume(): number {
  try {
    const raw = localStorage.getItem(VOLUME_KEY);
    if (raw === null) {
      return DEFAULT_VOLUME;
    }
    const n = Number(raw);
    if (!Number.isFinite(n)) {
      return DEFAULT_VOLUME;
    }
    return Math.min(1, Math.max(0, n));
  } catch {
    return DEFAULT_VOLUME;
  }
}

export default function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [enabled, setEnabled] = useState(readEnabled);
  const [volume, setVolume] = useState(readVolume);
  const [expanded, setExpanded] = useState(false);
  const [blocked, setBlocked] = useState(false);

  const tryPlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !enabled) {
      return;
    }
    try {
      await audio.play();
      setBlocked(false);
    } catch {
      setBlocked(true);
    }
  }, [enabled]);

  useEffect(() => {
    try {
      localStorage.setItem(ENABLED_KEY, enabled ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [enabled]);

  useEffect(() => {
    try {
      localStorage.setItem(VOLUME_KEY, String(volume));
    } catch {
      /* ignore */
    }
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    if (enabled) {
      void tryPlay();
    } else {
      audio.pause();
      setBlocked(false);
    }
  }, [enabled, tryPlay]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const resume = () => {
      void tryPlay();
    };
    window.addEventListener('load', resume);
    window.addEventListener('pageshow', resume);
    return () => {
      window.removeEventListener('load', resume);
      window.removeEventListener('pageshow', resume);
    };
  }, [enabled, tryPlay]);

  useEffect(() => {
    if (!enabled || !blocked) {
      return;
    }
    const resume = () => {
      void tryPlay();
    };
    window.addEventListener('pointerdown', resume, { once: true });
    window.addEventListener('keydown', resume, { once: true });
    return () => {
      window.removeEventListener('pointerdown', resume);
      window.removeEventListener('keydown', resume);
    };
  }, [enabled, blocked, tryPlay]);

  const volumePercent = Math.round(volume * 100);

  return (
    <>
      <audio
        ref={audioRef}
        src={MUSIC_SRC}
        loop
        preload="auto"
        autoPlay={enabled}
        aria-hidden="true"
      />
      <div className={`music-control ${expanded ? 'music-control--open' : ''}`}>
        {expanded && (
          <div className="music-volume-panel">
            <label className="music-volume-label" htmlFor="music-volume">
              Громкость
            </label>
            <div className="music-volume-row">
              <span className="music-volume-icon" aria-hidden="true">
                🔈
              </span>
              <input
                id="music-volume"
                type="range"
                className="music-volume-slider"
                style={{ '--music-fill': `${volumePercent}%` } as React.CSSProperties}
                min={0}
                max={100}
                step={1}
                value={volumePercent}
                onChange={(e) => setVolume(Number(e.target.value) / 100)}
                aria-valuetext={`${volumePercent} процентов`}
              />
              <span className="music-volume-icon music-volume-icon--loud" aria-hidden="true">
                🔊
              </span>
              <span className="music-volume-value">{volumePercent}%</span>
            </div>
          </div>
        )}

        <div className="music-control-bar">
          <button
            type="button"
            className="music-toggle"
            onClick={() => setEnabled((v) => !v)}
            aria-pressed={enabled}
            aria-label={enabled ? 'Выключить фоновую музыку' : 'Включить фоновую музыку'}
            title={enabled ? 'Выключить музыку' : 'Включить музыку'}
          >
            <span className="music-toggle-icon" aria-hidden="true">
              {enabled ? '♪' : '🔇'}
            </span>
            <span className="music-toggle-label">{enabled ? 'Музыка' : 'Тишина'}</span>
          </button>

          <button
            type="button"
            className="music-expand"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-controls="music-volume"
            title={expanded ? 'Скрыть громкость' : 'Настроить громкость'}
          >
            {expanded ? '▾' : '▴'}
          </button>
        </div>
      </div>
    </>
  );
}
