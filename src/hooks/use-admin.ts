import { useMemo } from 'react';
import { getLocalSpecialistProfile, hasLocalAccessProfile, isLocalAdminEmail } from '@/lib/local-access';

type LocalAdminUser = {
  email: string;
  name: string;
};

export function useAdmin() {
  const profile = useMemo(() => getLocalSpecialistProfile(), []);
  const localAccess = useMemo(() => hasLocalAccessProfile(), []);

  const user: LocalAdminUser = {
    email: profile?.email || '',
    name: profile?.fullName || '',
  };

  return {
    // Local-first mode: if the specialist already passed institutional access,
    // allow access to admin diagnostic tools even if email is not whitelisted.
    isAdmin: localAccess || isLocalAdminEmail(profile?.email),
    loading: false,
    user,
  };
}