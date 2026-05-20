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
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2, UserPlus } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const SignupFormSchema = z.object({
  fullName: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  email: z.string().email({ message: 'Por favor, ingresa un email válido.' }),
  apiKey: z.string().optional(),
}).refine((data) => data.email && data.fullName, {
  message: "Nombre y correo son requeridos.",
});


export default function SignupPage() {
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (hasLocalAccessProfile()) {
      router.replace('/dashboard');
    }
  }, [router]);

  const form = useForm<z.infer<typeof SignupFormSchema>>({
    resolver: zodResolver(SignupFormSchema),
    defaultValues: {
      fullName: '',
      email: '',
      apiKey: '',
    },
  });

  const handleSignUp = async (values: z.infer<typeof SignupFormSchema>) => {
    try {
      saveLocalSpecialistProfile({
        fullName: values.fullName,
        email: values.email,
        apiKey: values.apiKey || undefined,
      });
      toast({
        title: 'Perfil creado exitosamente',
        description: 'Ahora puedes acceder al sistema.',
      });
      router.push('/dashboard');
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Error al registrarse',
        description: 'Ocurrió un error al crear el perfil local.',
      });
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Crear Perfil</CardTitle>
          <CardDescription>
            Ingresa tus datos para registrarte en el sistema local.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSignUp)}>
                <CardContent className="grid gap-4">
                    <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Nombre Completo</FormLabel>
                            <FormControl>
                                <Input placeholder="Dr. Juan Pérez" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Correo Electrónico</FormLabel>
                            <FormControl>
                                <Input type="email" placeholder="nombre@ejemplo.com" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="apiKey"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>API Key de IA (opcional)</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="Tu clave API de Gemini" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button type="submit" className="w-full">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Registrarse
                    </Button>
                     <div className="text-center text-sm">
                        ¿Ya tienes una cuenta?{' '}
                        <Link href="/login" className="underline">
                        Iniciar Sesión
                        </Link>
                    </div>
                </CardFooter>
            </form>
        </Form>
      </Card>
    </div>
  );
}
