'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLogo } from '@/components/app-logo';
import { hasLocalAccessProfile } from '@/lib/local-access';

export default function InstitutionalLandingPage() {
  const router = useRouter();

  useEffect(() => {
    if (hasLocalAccessProfile()) {
      router.replace('/dashboard');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f8fbff_0%,_#eef4fa_100%)] flex items-center justify-center px-6">
      <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-2xl backdrop-blur md:p-12">
        <div className="flex flex-col items-center text-center">
          <AppLogo name="PIGEC-130" logoUrl="" />
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.3em] text-sky-700">
            Plataforma Institucional
          </p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
            Gestión clínica y psicopedagógica en modo local seguro
          </h1>
          <p className="mt-5 max-w-2xl text-base text-slate-600 md:text-lg">
            El acceso se habilita con el código institucional y un perfil local del especialista. Las evaluaciones públicas continúan disponibles sin autenticación desde sus enlaces directos.
          </p>
        </div>
      </div>
    </div>
  );
}
