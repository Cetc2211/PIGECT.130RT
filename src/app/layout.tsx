import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/context/SessionContext";
import { Toaster } from "@/components/ui/toaster";
import { LayoutShell } from "@/components/layout-shell";
import { DataProvider } from "@/hooks/use-data";
import { InstitutionalAccessGate } from "@/components/institutional-access-gate";

export const metadata: Metadata = {
  title: "Suite Integral - Sistema de Soporte a la Decisión",
  description: "Plataforma para el análisis de riesgo y gestión de expedientes del protocolo MTSS-CBTA 130.",
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
       <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans bg-gray-50 text-gray-900">
        <DataProvider>
          <SessionProvider>
            <InstitutionalAccessGate>
              <LayoutShell>
                {children}
              </LayoutShell>
            </InstitutionalAccessGate>
            <Toaster />
          </SessionProvider>
        </DataProvider>
      </body>
    </html>
  );
}
