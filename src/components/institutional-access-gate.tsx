'use client';

import Image from 'next/image';
import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LockKeyhole, ShieldCheck, UserRound, KeyRound } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { hasLocalAccessProfile, saveLocalSpecialistProfile } from '@/lib/local-access';
import { USER_GEMINI_API_KEY_STORAGE_KEY } from '@/lib/ai-service';

export function InstitutionalAccessGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [ready, setReady] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [institutionalCode, setInstitutionalCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [expectedCode, setExpectedCode] = useState('');

  const isEvaluationRoute = pathname.startsWith('/evaluacion/');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const code = process.env.NEXT_PUBLIC_INSTITUTIONAL_CODE || 'PIGEC-130-2026';
    setExpectedCode(code);

    const unlocked = hasLocalAccessProfile();
    if (unlocked) {
      try {
        const profileRaw = localStorage.getItem('pigec_local_specialist_profile');
        if (profileRaw) {
          const profile = JSON.parse(profileRaw);
          setFullName(profile.fullName || '');
          setEmail(profile.email || '');
          setApiKey(profile.apiKey || localStorage.getItem(USER_GEMINI_API_KEY_STORAGE_KEY) || '');
        }
      } catch {
        // Ignore invalid local profile data
      }
    }

    setIsUnlocked(unlocked);
    setReady(true);
  }, []);

  const handleUnlock = () => {
    setError('');

    if (institutionalCode.trim() !== expectedCode.trim()) {
      setError('Código Institucional Inválido');
      return;
    }

    if (!fullName.trim() || !email.trim()) {
      setError('Ingresa nombre completo y correo electrónico.');
      return;
    }

    saveLocalSpecialistProfile({
      fullName,
      email,
      apiKey,
    });

    setIsUnlocked(true);
    toast({
      title: 'Acceso habilitado',
      description: 'Tu perfil local se guardó correctamente.',
    });

    router.replace('/dashboard');
  };

  if (!ready) {
    return <>{children}</>;
  }

  if (isEvaluationRoute || isUnlocked) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 flex items-center justify-center px-6 py-12">
      <Card className="w-full max-w-2xl border border-slate-200 shadow-2xl bg-white">
        <CardHeader className="space-y-6 text-center">
          <div className="flex justify-center">
            <Image
              src="/logo.cbta130.png.png"
              alt="Logo CBTa 130"
              width={80}
              height={80}
              className="h-20 w-auto object-contain"
            />
          </div>
          <div className="space-y-3">
            <CardTitle className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
              Bienvenido a la Plataforma del Protocolo de Intervención Psicopedagógica y Gestión del Entorno Comunitario del CBTa 130 (PIGEC-130)
            </CardTitle>
            <p className="text-base text-slate-600">
              Esta herramienta está diseñada para la gestión clínica y pedagógica, permitiendo la creación de expedientes, aplicación de evaluaciones y generación de informes diagnósticos mediante IA de manera local y segura.
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="institutional-code" className="text-sm font-semibold text-slate-700">
                Código de Acceso Institucional
              </Label>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="institutional-code"
                  type="password"
                  value={institutionalCode}
                  onChange={(e) => setInstitutionalCode(e.target.value)}
                  placeholder="Ingresa el código"
                  className="pl-10"
                  onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialist-full-name" className="text-sm font-semibold text-slate-700">
                Nombre Completo del Especialista
              </Label>
              <div className="relative">
                <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="specialist-full-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej. Dra. María Pérez"
                  className="pl-10"
                  onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialist-email" className="text-sm font-semibold text-slate-700">
                Correo Electrónico
              </Label>
              <Input
                id="specialist-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@institucion.mx"
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialist-api-key" className="text-sm font-semibold text-slate-700">
                API Key de Gemini (Opcional)
              </Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="specialist-api-key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Tu API Key personal (no se compartirá)"
                  className="pl-10"
                  onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Si no la agregas, la app funcionará normalmente. Solo se deshabilitarán los botones que requieran generación de IA.
              </p>
            </div>
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}
            <Button className="w-full h-10 bg-sky-600 hover:bg-sky-700 text-white font-semibold" onClick={handleUnlock}>
              Configurar y Entrar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
