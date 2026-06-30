import { UserGender } from './api';

const REMEMBER_PREF_KEY = 'rememberMe';

export function readRememberPreference(): boolean {
  return localStorage.getItem(REMEMBER_PREF_KEY) !== '0';
}

function activeStorage(): Storage | null {
  if (localStorage.getItem('token')) {
    return localStorage;
  }
  if (sessionStorage.getItem('token')) {
    return sessionStorage;
  }
  return null;
}

export function readToken(): string | null {
  return localStorage.getItem('token') ?? sessionStorage.getItem('token');
}

export function readUsername(): string | null {
  return localStorage.getItem('username') ?? sessionStorage.getItem('username');
}

export function readAdminFlag(): boolean {
  const raw =
    localStorage.getItem('isAdmin') ?? sessionStorage.getItem('isAdmin');
  return raw === '1';
}

export function readGender(): UserGender {
  const raw = localStorage.getItem('gender') ?? sessionStorage.getItem('gender');
  return raw === 'FEMALE' ? 'FEMALE' : 'MALE';
}

export function saveAuthSession(
  token: string,
  username: string,
  isAdmin: boolean,
  remember: boolean,
  gender?: UserGender,
) {
  localStorage.setItem(REMEMBER_PREF_KEY, remember ? '1' : '0');
  const primary = remember ? localStorage : sessionStorage;
  const secondary = remember ? sessionStorage : localStorage;

  for (const key of ['token', 'username', 'isAdmin', 'gender'] as const) {
    secondary.removeItem(key);
  }

  primary.setItem('token', token);
  primary.setItem('username', username);
  primary.setItem('isAdmin', isAdmin ? '1' : '0');
  if (gender) {
    primary.setItem('gender', gender);
  }
}

export function patchAuthProfile(username: string, isAdmin: boolean, gender: UserGender) {
  const storage = activeStorage();
  if (!storage) {
    return;
  }
  storage.setItem('username', username);
  storage.setItem('isAdmin', isAdmin ? '1' : '0');
  storage.setItem('gender', gender);
}

export function clearAuthSession() {
  for (const storage of [localStorage, sessionStorage]) {
    storage.removeItem('token');
    storage.removeItem('username');
    storage.removeItem('isAdmin');
    storage.removeItem('gender');
  }
}
