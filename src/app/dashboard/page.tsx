'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from '@/context/SessionContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  FolderOpen,
  Users,
  ClipboardCheck,
  AlertTriangle,
  Shield,
  Activity,
  TrendingDown,
  GraduationCap,
  BookOpen,
  Stethoscope,
  Layers,
  BarChart3,
  FolderKanban,
  ClipboardList,
} from 'lucide-react';
import {
  calcularEstadisticas,
  getNivelLabel,
  getNivelShort,
  getEstadoLabel,
} from '@/lib/expediente-service';
import type { AppStatistics } from '@/lib/expediente-service';

export default function DashboardPage() {
    const { role } = useSession();
    const [stats, setStats] = React.useState<AppStatistics | null>(null);

    React.useEffect(() => {
        setStats(calcularEstadisticas());
    }, []);

    if (!stats) {
        return (
            <div className="p-8 flex items-center justify-center">
                <p className="text-gray-500">Cargando estadísticas...</p>
            </div>
        );
    }

    return (
        <div className="p-8">
            {/* Encabezado */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Dashboard de Riesgo</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Vista general del sistema de detección temprana y seguimiento — CBTA 130 · Protocolo MTSS
                </p>
            </div>

            {/* ─── SECCIÓN 1: RESUMEN GENERAL ─────────────────────────────── */}
            <div className="mb-8">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                    Resumen General
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard
                        icon={<GraduationCap className="h-5 w-5" />}
                        iconBg="bg-blue-100 text-blue-600"
                        label="Grupos Registrados"
                        value={stats.totalGrupos}
                        sublabel={`${stats.gruposEvaluadosNivel1 + stats.gruposEvaluadosNivel2 + stats.gruposEvaluadosNivel3} evaluados`}
                    />
                    <StatCard
                        icon={<Users className="h-5 w-5" />}
                        iconBg="bg-emerald-100 text-emerald-600"
                        label="Estudiantes Registrados"
                        value={stats.totalEstudiantes}
                        sublabel={`${stats.estudiantesEvaluados} evaluados`}
                    />
                    <StatCard
                        icon={<FolderOpen className="h-5 w-5" />}
                        iconBg="bg-violet-100 text-violet-600"
                        label="Expedientes"
                        value={stats.totalExpedientes}
                        sublabel={`${stats.expedientesAbiertos} abiertos · ${stats.expedientesEnSeguimiento} en seguimiento`}
                    />
                </div>
            </div>

            {/* ─── SECCIÓN 2: GRUPOS POR NIVEL DE EVALUACIÓN ──────────────── */}
            <div className="mb-8">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                    Grupos Evaluados por Nivel
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <NivelCard
                        nivel="1"
                        color="green"
                        label="Detección Universal"
                        valor={stats.gruposEvaluadosNivel1}
                        icon={<Layers className="h-5 w-5" />}
                        descripcion="Tamizaje grupal aplicado a todos los estudiantes del grupo."
                    />
                    <NivelCard
                        nivel="2"
                        color="yellow"
                        label="Intervención Focalizada"
                        valor={stats.gruposEvaluadosNivel2}
                        icon={<BookOpen className="h-5 w-5" />}
                        descripcion="Al menos un estudiante del grupo requiere intervención especializada."
                    />
                    <NivelCard
                        nivel="3"
                        color="red"
                        label="Intervención Intensiva"
                        valor={stats.gruposEvaluadosNivel3}
                        icon={<Stethoscope className="h-5 w-5" />}
                        descripcion="Al menos un estudiante del grupo requiere atención clínica especializada."
                    />
                </div>
            </div>

            {/* ─── SECCIÓN 3: ESTUDIANTES POR NIVEL DE ATENCIÓN ─────────── */}
            <div className="mb-8">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                    Estudiantes por Nivel de Atención
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <NivelCard
                        nivel="1"
                        color="green"
                        label="Sin Necesidad Especial"
                        valor={stats.estudiantesNivel1}
                        icon={<Shield className="h-5 w-5" />}
                        descripcion="Estudiantes sin banderas de riesgo identificadas."
                    />
                    <NivelCard
                        nivel="2"
                        color="yellow"
                        label="Necesitan Atención Nivel 2"
                        valor={stats.estudiantesNivel2}
                        icon={<AlertTriangle className="h-5 w-5" />}
                        descripcion="Estudiantes con banderas de riesgo que requieren intervención focalizada."
                    />
                    <NivelCard
                        nivel="3"
                        color="red"
                        label="Necesitan Atención Nivel 3"
                        valor={stats.estudiantesNivel3}
                        icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
                        descripcion="Estudiantes con riesgo alto/crítico que requieren atención clínica intensiva."
                    />
                </div>
            </div>

            {/* ─── SECCIÓN 4: ESTADO DE EXPEDIENTES ──────────────────────── */}
            <div className="mb-8">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                    Estado de Expedientes
                </h2>
                <Card>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-gray-800">{stats.expedientesAbiertos}</p>
                                <p className="text-xs text-gray-500 mt-1">Abiertos</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-blue-600">{stats.expedientesEnSeguimiento}</p>
                                <p className="text-xs text-gray-500 mt-1">En Seguimiento</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-green-600">{stats.expedientesConcluidos}</p>
                                <p className="text-xs text-gray-500 mt-1">Concluidos</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-gray-400">{stats.totalExpedientes}</p>
                                <p className="text-xs text-gray-500 mt-1">Total</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ─── SECCIÓN 5: ACCESO RÁPIDO ────────────────────────────── */}
            <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                    Acceso Rápido
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <QuickLinkCard
                        href="/expedientes"
                        icon={<FolderOpen className="h-5 w-5" />}
                        color="bg-blue-100 text-blue-600"
                        title="Expedientes"
                        description="Consultar y gestionar expedientes clínicos y educativos."
                    />
                    {role === 'Clinico' && (
                        <QuickLinkCard
                            href="/screening"
                            icon={<ClipboardList className="h-5 w-5" />}
                            color="bg-purple-100 text-purple-600"
                            title="Gestión de Pruebas"
                            description="Aplicar instrumentos de tamizaje y evaluación psicométrica."
                        />
                    )}
                    <QuickLinkCard
                        href="/educativa/evaluacion"
                        icon={<BookOpen className="h-5 w-5" />}
                        color="bg-green-100 text-green-600"
                        title="Evaluación Educativa"
                        description="Evaluaciones grupales e individuales (CHTE, Neuropsicológico)."
                    />
                    {role === 'Orientador' && (
                        <QuickLinkCard
                            href="/orientacion"
                            icon={<Users className="h-5 w-5" />}
                            color="bg-amber-100 text-amber-600"
                            title="Panel de Orientación"
                            description="Gestión de detección universal e intervención focalizada."
                        />
                    )}
                    <QuickLinkCard
                        href="/tools"
                        icon={<FolderKanban className="h-5 w-5" />}
                        color="bg-orange-100 text-orange-600"
                        title="Repositorio de Recursos"
                        description="Evidencias, guías clínicas y materiales de intervención."
                    />
                    {role === 'Clinico' && (
                        <QuickLinkCard
                            href="/admin"
                            icon={<BarChart3 className="h-5 w-5" />}
                            color="bg-gray-100 text-gray-600"
                            title="Administración"
                            description="Gestión de usuarios, grupos y configuración del sistema."
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── COMPONENTES AUXILIARES ──────────────────────────────────────────────────

function StatCard({ icon, iconBg, label, value, sublabel }: {
    icon: React.ReactNode;
    iconBg: string;
    label: string;
    value: number;
    sublabel: string;
}) {
    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-gray-500">{label}</p>
                        <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
                        <p className="text-xs text-gray-400 mt-1">{sublabel}</p>
                    </div>
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${iconBg}`}>
                        {icon}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function NivelCard({ nivel, color, label, valor, icon, descripcion }: {
    nivel: string;
    color: 'green' | 'yellow' | 'red';
    label: string;
    valor: number;
    icon: React.ReactNode;
    descripcion: string;
}) {
    const borderColors = {
        green: 'border-green-200 bg-green-50',
        yellow: 'border-yellow-200 bg-yellow-50',
        red: 'border-red-200 bg-red-50',
    };
    const textColors = {
        green: 'text-green-700',
        yellow: 'text-yellow-700',
        red: 'text-red-700',
    };
    const badgeColors = {
        green: 'bg-green-200 text-green-800',
        yellow: 'bg-yellow-200 text-yellow-800',
        red: 'bg-red-200 text-red-800',
    };
    const numberColors = {
        green: 'text-green-700',
        yellow: 'text-yellow-700',
        red: 'text-red-700',
    };

    return (
        <Card className={borderColors[color]}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={textColors[color]}>{icon}</div>
                        <div>
                            <CardTitle className={`text-sm font-medium ${textColors[color]}`}>
                                Nivel {nivel}
                            </CardTitle>
                            <CardDescription className="text-xs text-gray-600">
                                {label}
                            </CardDescription>
                        </div>
                    </div>
                    <Badge className={badgeColors[color]} variant="outline">
                        {valor}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <p className={`text-4xl font-bold ${numberColors[color]}`}>{valor}</p>
                <p className="text-xs text-gray-500 mt-2">{descripcion}</p>
            </CardContent>
        </Card>
    );
}

function QuickLinkCard({ href, icon, color, title, description }: {
    href: string;
    icon: React.ReactNode;
    color: string;
    title: string;
    description: string;
}) {
    return (
        <Link href={href} className="block">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${color}`}>
                        {icon}
                    </div>
                    <CardTitle className="text-sm mt-2">{title}</CardTitle>
                    <CardDescription className="text-xs">{description}</CardDescription>
                </CardHeader>
            </Card>
        </Link>
    );
}
