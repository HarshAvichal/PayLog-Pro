// Simple authentication utilities

const VALID_EMAIL = process.env.NEXT_PUBLIC_AUTH_EMAIL || 'harshavichal08@gmail.com';
const VALID_PASSWORD = process.env.NEXT_PUBLIC_AUTH_PASSWORD || 'Harsh123@';
const AUTH_KEY = 'paylog_auth';

export interface AuthCredentials {
  email: string;
  password: string;
}

export function validateCredentials(email: string, password: string): boolean {
  return email === VALID_EMAIL && password === VALID_PASSWORD;
}

export function setAuthStatus(authenticated: boolean): void {
  if (typeof window !== 'undefined') {
    if (authenticated) {
      localStorage.setItem(AUTH_KEY, 'true');
    } else {
      localStorage.removeItem(AUTH_KEY);
    }
  }
}

export function isAuthenticated(): boolean {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(AUTH_KEY) === 'true';
  }
  return false;
}

export function logout(): void {
  setAuthStatus(false);
}

