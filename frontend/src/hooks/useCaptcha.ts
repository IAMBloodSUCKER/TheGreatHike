import { useCallback, useEffect, useState } from 'react';
import { api, CaptchaResponse } from '../api';

export function useCaptcha() {
  const [captcha, setCaptcha] = useState<CaptchaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getCaptcha();
      setCaptcha(data);
    } catch (err) {
      setCaptcha(null);
      setError(err instanceof Error ? err.message : 'Не удалось загрузить капчу');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { captcha, refresh, loading, error };
}
