import { USER_GEMINI_API_KEY_STORAGE_KEY } from '@/lib/ai-service';

export const LOCAL_ADMIN_EMAIL = 'ceciliotopetecruz@gmail.com';
export const LOCAL_INSTITUTIONAL_CODE_FALLBACK = 'PIGEC-130-2026';
export const LOCAL_SPECIALIST_PROFILE_KEY = 'pigec_local_specialist_profile';
export const LOCAL_ACCESS_GRANTED_KEY = 'pigec_local_access_granted';

export type LocalSpecialistProfile = {
  fullName: string;
  email: string;
  apiKey?: string;
  createdAt: string;
};

function canUseLocalStorage() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

export function getInstitutionalCode(): string {
  return process.env.NEXT_PUBLIC_INSTITUTIONAL_CODE || LOCAL_INSTITUTIONAL_CODE_FALLBACK;
}

export function getLocalSpecialistProfile(): LocalSpecialistProfile | null {
  if (!canUseLocalStorage()) return null;
  try {
    const raw = localStorage.getItem(LOCAL_SPECIALIST_PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalSpecialistProfile;
    if (!parsed?.fullName || !parsed?.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function hasLocalAccessProfile(): boolean {
  if (!canUseLocalStorage()) return false;
  return !!getLocalSpecialistProfile() && localStorage.getItem(LOCAL_ACCESS_GRANTED_KEY) === 'true';
}

export function saveLocalSpecialistProfile(profile: Omit<LocalSpecialistProfile, 'createdAt'>): LocalSpecialistProfile {
  const normalized: LocalSpecialistProfile = {
    fullName: profile.fullName.trim(),
    email: profile.email.trim().toLowerCase(),
    apiKey: profile.apiKey?.trim() || '',
    createdAt: new Date().toISOString(),
  };

  if (!canUseLocalStorage()) {
    return normalized;
  }

  localStorage.setItem(LOCAL_SPECIALIST_PROFILE_KEY, JSON.stringify(normalized));
  localStorage.setItem(LOCAL_ACCESS_GRANTED_KEY, 'true');
  localStorage.setItem('userRole', isLocalAdminEmail(normalized.email) ? 'Clinico' : 'Clinico');

  if (normalized.apiKey) {
    localStorage.setItem(USER_GEMINI_API_KEY_STORAGE_KEY, normalized.apiKey);
  } else {
    localStorage.removeItem(USER_GEMINI_API_KEY_STORAGE_KEY);
  }

  return normalized;
}

export function clearLocalSpecialistProfile(): void {
  if (!canUseLocalStorage()) return;
  localStorage.removeItem(LOCAL_SPECIALIST_PROFILE_KEY);
  localStorage.removeItem(LOCAL_ACCESS_GRANTED_KEY);
  localStorage.removeItem('userRole');
  localStorage.removeItem(USER_GEMINI_API_KEY_STORAGE_KEY);
}

export function isLocalAdminEmail(email?: string | null): boolean {
  return (email || '').trim().toLowerCase() === LOCAL_ADMIN_EMAIL.toLowerCase();
}
