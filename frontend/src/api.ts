import { readToken } from './authStorage';

export const API_BASE = import.meta.env.VITE_API_URL ?? '';

export interface CaptchaResponse {
  captchaId: string;
  imageBase64: string;
}

export interface AuthResponse {
  token: string;
  username: string;
  admin: boolean;
}

export type UserGender = 'MALE' | 'FEMALE';

export interface MeResponse {
  username: string;
  admin: boolean;
  gender: UserGender;
}

export interface Feedback {
  id: string;
  username: string;
  message: string;
  createdAt: string;
  adminReply: string | null;
  repliedAt: string | null;
  replyUnread: boolean;
  adminInitiated: boolean;
}

export interface AdminOverview {
  totalUsers: number;
  totalFeedback: number;
  unrepliedFeedback: number;
  usersWithFeedback: number;
}

export interface AdminUser {
  id: string;
  username: string;
  createdAt: string;
  gender: UserGender;
  admin: boolean;
  blocked: boolean;
  feedbackCount: number;
  unrepliedFeedbackCount: number;
}

export interface AdminFeedback {
  id: string;
  userId: string;
  username: string;
  message: string;
  createdAt: string;
  adminReply: string | null;
  repliedAt: string | null;
  adminInitiated: boolean;
}

export interface AdminTrackingOverview {
  totalVisits: number;
  totalGrams: number;
  activeUsers: number;
}

export interface UserVisitStats {
  userId: string;
  visitCount: number;
  totalGrams: number;
}

export interface AdminUnlockResponse {
  adminSessionToken: string;
  expiresInSeconds: number;
}

export interface TermsResponse {
  version: string;
  title: string;
  content: string;
}

export type ConsistencyLevel =
  | 'LIQUID'
  | 'PELLETS'
  | 'LUMPY'
  | 'MOREL'
  | 'NORMAL'
  | 'SOFT'
  | 'FIRM'
  | 'GIANT'
  | 'CUSTOM'
  | 'TINY'
  | 'SMALL'
  | 'MEDIUM'
  | 'LARGE';

export interface ConsistencyInfo {
  level: ConsistencyLevel;
  label: string;
  description: string;
  gramsPerUnit: number;
  imageKey: string;
}

export type StoolColor =
  | 'BROWN'
  | 'LIGHT_BROWN'
  | 'DARK_BROWN'
  | 'YELLOW'
  | 'GREEN'
  | 'BLACK'
  | 'RED';

export interface StoolColorInfo {
  color: StoolColor;
  label: string;
  hex: string;
}

export interface ComparisonVisual {
  emoji: string;
  count: number;
  text: string;
  gramsPerUnit: number;
  objectName: string;
}

export interface VolumePreview {
  grams: number;
  percentOfHumanBody: number;
  humanComparison: string;
  comparisons: string[];
  comparisonItems: ComparisonVisual[];
}

export interface FunFact {
  emoji: string;
  text: string;
  comparisons: string[];
}

export interface PeriodStats {
  period: string;
  totalGrams: number;
  totalVisits: number;
  totalCount: number;
  funFact: FunFact;
}

export interface Visit {
  id: string;
  count: number;
  consistency: ConsistencyLevel;
  consistencyLabel: string;
  imageKey: string;
  totalGrams: number;
  color: StoolColor;
  colorLabel: string;
  colorHex: string;
  note: string | null;
  visitedAt: string;
}

export interface Dashboard {
  periods: PeriodStats[];
  recentVisits: Visit[];
  consistencyLevels: ConsistencyInfo[];
  stoolColors: StoolColorInfo[];
}

function authHeaders(): HeadersInit {
  const token = readToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function adminHeaders(adminSession: string): HeadersInit {
  return { ...authHeaders(), 'X-Admin-Session': adminSession };
}

function parseApiError(text: string, status: number): string {
  const trimmed = text.trim();

  if (trimmed.startsWith('<') || trimmed.includes('<html')) {
    if (status === 502 || trimmed.includes('502 Bad Gateway')) {
      return 'Сервер временно недоступен. Подождите минуту после перезапуска и попробуйте снова.';
    }
    if (status === 503) {
      return 'Сервис перезапускается — попробуйте через минуту.';
    }
    if (status === 504) {
      return 'Сервер не успел ответить. Попробуйте ещё раз.';
    }
    return `Ошибка сервера (${status}). Попробуйте позже.`;
  }

  try {
    const json = JSON.parse(text) as {
      detail?: string;
      message?: string;
      error?: string;
      errors?: Array<{ defaultMessage?: string; message?: string }>;
    };
    if (json.detail) {
      return json.detail;
    }
    if (json.errors?.length) {
      const parts = json.errors
        .map((e) => e.defaultMessage ?? e.message)
        .filter((m): m is string => Boolean(m));
      if (parts.length) {
        return parts.join('. ');
      }
    }
    if (json.message && json.message !== 'Bad Request' && json.message !== 'Forbidden') {
      return json.message;
    }
    if (status === 401 || json.error === 'Unauthorized') {
      return 'Сессия истекла — войдите заново';
    }
    if (status === 403 || json.error === 'Forbidden') {
      return json.message ?? 'Недостаточно прав для этого действия';
    }
    if (status === 400) {
      return json.message ?? 'Неверный запрос. Проверьте капчу и секретный ключ.';
    }
    if (typeof json.error === 'string' && json.error !== 'Internal Server Error') {
      return json.error;
    }
  } catch {
    // не JSON
  }

  if (status === 502) {
    return 'Сервер временно недоступен. Подождите минуту и попробуйте снова.';
  }
  if (status === 500) {
    return 'Внутренняя ошибка сервера. Попробуйте позже.';
  }

  return trimmed.length > 0 ? trimmed.slice(0, 240) : `Ошибка ${status}`;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(parseApiError(text, res.status));
  }
  return res.json();
}

export const api = {
  async getCaptcha(): Promise<CaptchaResponse> {
    const res = await fetch(`${API_BASE}/api/auth/captcha`);
    return handleResponse(res);
  },

  async getTerms(): Promise<TermsResponse> {
    const res = await fetch(`${API_BASE}/api/auth/terms`);
    return handleResponse(res);
  },

  async isUsernameAvailable(username: string): Promise<boolean> {
    const params = new URLSearchParams({ username });
    const res = await fetch(`${API_BASE}/api/auth/username-available?${params}`);
    const data = await handleResponse<{ available: boolean }>(res);
    return data.available;
  },

  async register(data: {
    username: string;
    password: string;
    recoveryKey: string;
    captchaId: string;
    captchaAnswer: string;
    termsAccepted: boolean;
    gender: UserGender;
  }): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async login(data: {
    username: string;
    password: string;
    captchaId: string;
    captchaAnswer: string;
    rememberMe?: boolean;
  }): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async recoverPassword(data: {
    username: string;
    recoveryKey: string;
    newPassword: string;
    captchaId: string;
    captchaAnswer: string;
    rememberMe?: boolean;
  }): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/api/auth/recover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async me(): Promise<MeResponse> {
    const res = await fetch(`${API_BASE}/api/auth/me`, { headers: authHeaders() });
    return handleResponse(res);
  },

  async createFeedback(message: string): Promise<Feedback> {
    const res = await fetch(`${API_BASE}/api/auth/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ message }),
    });
    return handleResponse(res);
  },

  async getMyFeedback(): Promise<Feedback[]> {
    const res = await fetch(`${API_BASE}/api/auth/feedback/mine`, { headers: authHeaders() });
    return handleResponse(res);
  },

  async getUnreadFeedbackCount(): Promise<{ count: number }> {
    const res = await fetch(`${API_BASE}/api/auth/feedback/unread-count`, { headers: authHeaders() });
    return handleResponse(res);
  },

  async markFeedbackRead(): Promise<{ count: number }> {
    const res = await fetch(`${API_BASE}/api/auth/feedback/mark-read`, {
      method: 'POST',
      headers: authHeaders(),
    });
    return handleResponse(res);
  },

  async getAllFeedback(adminSession: string): Promise<Feedback[]> {
    const res = await fetch(`${API_BASE}/api/auth/admin/feedback`, {
      headers: adminHeaders(adminSession),
    });
    return handleResponse(res);
  },

  async unlockAdmin(data: {
    captchaId: string;
    captchaAnswer: string;
    adminSecret: string;
  }): Promise<AdminUnlockResponse> {
    const res = await fetch(`${API_BASE}/api/auth/admin/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async replyToFeedback(id: string, reply: string, adminSession: string): Promise<Feedback> {
    const res = await fetch(`${API_BASE}/api/auth/admin/feedback/${id}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...adminHeaders(adminSession) },
      body: JSON.stringify({ reply }),
    });
    return handleResponse(res);
  },

  async getAdminOverview(adminSession: string): Promise<AdminOverview> {
    const res = await fetch(`${API_BASE}/api/auth/admin/overview`, {
      headers: adminHeaders(adminSession),
    });
    return handleResponse(res);
  },

  async getAdminUsers(adminSession: string): Promise<AdminUser[]> {
    const res = await fetch(`${API_BASE}/api/auth/admin/users`, {
      headers: adminHeaders(adminSession),
    });
    return handleResponse(res);
  },

  async getAdminUserFeedback(userId: string, adminSession: string): Promise<AdminFeedback[]> {
    const res = await fetch(`${API_BASE}/api/auth/admin/users/${userId}/feedback`, {
      headers: adminHeaders(adminSession),
    });
    return handleResponse(res);
  },

  async sendAdminDirectMessage(
    userId: string,
    message: string,
    adminSession: string,
  ): Promise<AdminFeedback> {
    const res = await fetch(`${API_BASE}/api/auth/admin/users/${userId}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...adminHeaders(adminSession) },
      body: JSON.stringify({ message }),
    });
    return handleResponse(res);
  },

  async blockAdminUser(userId: string, adminSession: string): Promise<AdminUser> {
    const res = await fetch(`${API_BASE}/api/auth/admin/users/${userId}/block`, {
      method: 'POST',
      headers: adminHeaders(adminSession),
    });
    return handleResponse(res);
  },

  async unblockAdminUser(userId: string, adminSession: string): Promise<AdminUser> {
    const res = await fetch(`${API_BASE}/api/auth/admin/users/${userId}/unblock`, {
      method: 'POST',
      headers: adminHeaders(adminSession),
    });
    return handleResponse(res);
  },

  async deleteAdminUser(userId: string, adminSession: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/auth/admin/users/${userId}`, {
      method: 'DELETE',
      headers: adminHeaders(adminSession),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(parseApiError(text, res.status));
    }
  },

  async getAdminTrackingOverview(adminSession: string): Promise<AdminTrackingOverview> {
    const res = await fetch(`${API_BASE}/api/tracking/admin/overview`, {
      headers: adminHeaders(adminSession),
    });
    return handleResponse(res);
  },

  async getAdminUserVisitStats(adminSession: string): Promise<UserVisitStats[]> {
    const res = await fetch(`${API_BASE}/api/tracking/admin/user-stats`, {
      headers: adminHeaders(adminSession),
    });
    return handleResponse(res);
  },

  async getDashboard(): Promise<Dashboard> {
    const res = await fetch(`${API_BASE}/api/tracking/dashboard`, {
      headers: authHeaders(),
    });
    return handleResponse(res);
  },

  async createVisit(data: {
    count: number;
    consistency: ConsistencyLevel;
    customGramsPerUnit?: number;
    color?: StoolColor;
    visitDate: string;
    note?: string;
  }): Promise<Visit> {
    const res = await fetch(`${API_BASE}/api/tracking/visits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async getVolumePreview(grams: number, seed?: string): Promise<VolumePreview> {
    const params = new URLSearchParams({ grams: String(grams) });
    if (seed) {
      params.set('seed', seed);
    }
    const res = await fetch(`${API_BASE}/api/tracking/volume-preview?${params}`, {
      headers: authHeaders(),
    });
    return handleResponse(res);
  },

  async deleteVisit(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/tracking/visits/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(parseApiError(text, res.status));
    }
  },

  async exportCsv(): Promise<Blob> {
    const res = await fetch(`${API_BASE}/api/tracking/export`, {
      headers: authHeaders(),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(parseApiError(text, res.status));
    }
    return res.blob();
  },
};
