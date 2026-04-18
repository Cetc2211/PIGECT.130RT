'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getLocalSpecialistProfile, hasLocalAccessProfile, isLocalAdminEmail, type LocalSpecialistProfile } from '@/lib/local-access';

type Role = 'Clinico' | 'Orientador' | 'loading' | 'unauthenticated' | null;

type LocalSessionUser = {
  email: string;
  name: string;
  isAdmin: boolean;
};

const EMPTY_USER: LocalSessionUser = {
  email: '',
  name: '',
  isAdmin: false,
};

interface SessionContextType {
  role: Role;
  setRole: (role: Role) => void;
  user: LocalSessionUser;
  loading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>('loading');
  const [user, setUser] = useState<LocalSessionUser>(EMPTY_USER);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const profile = getLocalSpecialistProfile();
    const hasAccess = hasLocalAccessProfile();

    if (!profile || !hasAccess) {
      setUser(EMPTY_USER);
      setRole('unauthenticated');
      setLoading(false);
      return;
    }

    setUser({
      email: profile.email,
      name: profile.fullName,
      isAdmin: isLocalAdminEmail(profile.email),
    });

    try {
      const storedRole = localStorage.getItem('userRole') as Role;
      if (storedRole === 'Orientador' || storedRole === 'Clinico') {
        setRole(storedRole);
      } else {
        setRole('Clinico');
        localStorage.setItem('userRole', 'Clinico');
      }
    } catch {
      setRole('Clinico');
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    // Rutas públicas que NO requieren autenticación
    const isPublicRoute =
      pathname === '/' ||
      pathname === '/login' ||
      pathname === '/signup' ||
      pathname.startsWith('/evaluacion/');

    // If not authenticated and not on a public route, redirect to home.
    if (role === 'unauthenticated' && !isPublicRoute) {
        router.replace('/');
    }
  }, [role, pathname, router]);

  const handleSetRole = (newRole: Role) => {
    if (newRole) {
      if(newRole !== 'unauthenticated' && newRole !== 'loading'){
        localStorage.setItem('userRole', newRole);
      } else {
        localStorage.removeItem('userRole');
      }
    }
    setRole(newRole);
  };

  const value = {
    role,
    setRole: handleSetRole as (role: Role) => void,
    user,
    loading,
  };
  
  // Show a generic loader if the session is still loading on any protected page.
  // Skip for public routes (/, /evaluacion/*) so students can see the evaluation page
  const isPublicPage =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname.startsWith('/evaluacion/');
  if (loading && role === 'loading' && !isPublicPage) {
    return (
        <div className="flex h-screen w-full items-center justify-center p-8">
            <div className="flex items-center gap-2 text-xl text-gray-600">
                Cargando Sesión...
            </div>
        </div>
    );
  }
  
  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
