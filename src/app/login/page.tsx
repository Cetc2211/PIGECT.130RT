'use client';

import { useEffect, useState } from 'react';
import { saveLocalSpecialistProfile, hasLocalAccessProfile } from '@/lib/local-access';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2, LogIn } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (hasLocalAccessProfile()) {
      router.replace('/dashboard');
    }
  }, [router]);

  const handleSignIn = async () => {
    if (!email.trim()) {
      toast({
        variant: 'destructive',
        title: 'Datos incompletos',
        description: 'Ingresa tu correo electrónico para continuar.',
      });
      return;
    }

    setIsSigningIn(true);

    try {
      saveLocalSpecialistProfile({
        fullName: fullName.trim() || 'Usuario Local',
        email: email.trim(),
        apiKey: apiKey.trim() || undefined,
      });
      toast({
        title: 'Acceso concedido',
        description: 'Bienvenido de nuevo.',
      });
      router.push('/dashboard');
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No fue posible iniciar sesión.',
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
          <CardDescription>
            Ingresa tus datos para acceder a tu panel.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="fullName">Nombre Completo (opcional)</Label>
            <Input
              id="fullName"
              placeholder="Dr. Juan Pérez"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="nombre@ejemplo.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="apiKey">API Key de IA (opcional)</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Tu clave API de Gemini"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button className="w-full" onClick={handleSignIn} disabled={isSigningIn}>
            {isSigningIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
            Iniciar Sesión
          </Button>
          <div className="text-center text-sm">
            ¿No tienes una cuenta?{' '}
            <Link href="/signup" className="underline">
              Regístrate
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
