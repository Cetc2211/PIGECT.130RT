'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { Sidebar } from '@/components/sidebar';

/**
 * LayoutShell — determina si mostrar el Sidebar o renderizar a pantalla completa.
 *
 * - Rutas de evaluación (/evaluacion/*): pantalla completa SIN sidebar
 * - Todas las demás rutas: sidebar + contenido normal
 */
export function LayoutShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isEvaluationRoute = pathname.startsWith('/evaluacion/');

  if (isEvaluationRoute) {
    // Ruta pública: pantalla completa, sin sidebar, sin wrapper flex
    return <>{children}</>;
  }

  // Ruta protegida: sidebar + contenido
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
