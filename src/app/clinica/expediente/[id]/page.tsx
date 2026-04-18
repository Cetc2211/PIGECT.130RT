'use client';

import { useParams, redirect } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useSession } from '@/context/SessionContext';
import React, { useEffect, useState } from 'react';

import ClinicalAssessmentForm from "@/components/clinical-assessment-form";
import FunctionalAnalysisForm from "@/components/functional-analysis-form";
import TreatmentPlanGenerator from "@/components/treatment-plan-generator";
import ProgressTracker from "@/components/progress-tracker";
import PIEIGenerator from "@/components/piei-generator";
import ReportGenerator from "@/components/ReportGenerator";
import { getStudentById, getClinicalAssessmentByStudentId, getFunctionalAnalysisByStudentId, getTreatmentPlanByStudentId, getProgressTrackingByStudentId, Student } from "@/lib/store";
import { getExpedienteById as getExpedienteById_Dinamico, type Expediente as ExpedienteType } from "@/lib/expediente-service";
import ClinicalKPILogger from '@/components/ClinicalKPILogger';
import RiskTimelineChart from '@/components/RiskTimelineChart';
import SOAPNotesForm from '@/components/SOAPNotesForm';
import WISCScoringConsole from '@/components/WISC-VScoringConsole';

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, ShieldAlert, Loader, ClipboardList, BookOpen, FileText, FileDown, Activity, UserCheck, BrainCircuit, TestTube2 } from "lucide-react";
import BancoDePruebas from '@/components/BancoDePruebas';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { NeuroScreeningConsole } from '@/components/NeuroScreeningConsole';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import StudentIdentificationCard from '@/components/StudentIdentificationCard';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, getDocs, collection, limit, query, where } from 'firebase/firestore';

function expedienteToStudent(exp: ExpedienteType): Student {
    return {
        id: exp.studentId,
        name: exp.studentName,
        demographics: { age: 0, group: exp.groupName, semester: exp.semester },
        emergencyContact: { name: '', phone: '' },
        suicideRiskLevel: exp.suicideRiskLevel || 'Bajo',
        academicData: { gpa: exp.academicData.gpa, absences: exp.academicData.absences },
        ansiedadScore: exp.ansiedadScore,
    };
}


export default function ClinicalFilePage() {
    const params = useParams();
    const studentId = params.id as string;
    const { role } = useSession();
    const [user, authLoading] = useAuthState(auth);
    const [student, setStudent] = useState<Student | undefined>(undefined);
    const [expedienteDinamico, setExpedienteDinamico] = useState<ExpedienteType | undefined>(undefined);
    const [loadingRemoteExpediente, setLoadingRemoteExpediente] = useState(false);

    useEffect(() => {
        if (!studentId || authLoading) {
            return;
        }

        const demoStudent = getStudentById(studentId);
        if (demoStudent) {
            setStudent(demoStudent);
            setExpedienteDinamico(undefined);
            setLoadingRemoteExpediente(false);
            return;
        }

        const expMemoria = getExpedienteById_Dinamico(studentId);
        if (expMemoria) {
            setExpedienteDinamico(expMemoria);
            setStudent(expedienteToStudent(expMemoria));
            setLoadingRemoteExpediente(false);
            return;
        }

        if (!db || !user) {
            setStudent(undefined);
            setExpedienteDinamico(undefined);
            setLoadingRemoteExpediente(false);
            return;
        }

        let isCancelled = false;

        const cargarExpedienteRemoto = async () => {
            setLoadingRemoteExpediente(true);

            try {
                const coleccionesCandidatas = ['expedientes', 'alumnos', 'students'];

                for (const nombreColeccion of coleccionesCandidatas) {
                    const docRef = doc(db, nombreColeccion, studentId);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        const data = docSnap.data() as Partial<ExpedienteType> & Record<string, any>;
                        const exp: ExpedienteType = {
                            id: data.id || docSnap.id,
                            studentId: data.studentId || docSnap.id,
                            studentName: data.studentName || data.nombreCompleto || data.name || 'Sin nombre',
                            groupName: data.groupName || data.grupoNombre || data.group || 'Sin grupo',
                            semester: Number(data.semester || data.semestre || 1),
                            nivel: (data.nivel as any) || 'nivel_1',
                            estado: (data.estado as any) || 'abierto',
                            origen: (data.origen as any) || 'registro_manual',
                            fechaCreacion: data.fechaCreacion || new Date().toISOString(),
                            fechaActualizacion: data.fechaActualizacion || new Date().toISOString(),
                            creadoPor: data.creadoPor || 'sistema',
                            academicData: {
                                gpa: Number(data.academicData?.gpa || data.gpa || 0),
                                absences: Number(data.academicData?.absences || data.absences || 0),
                            },
                            fichaIdentificacion: data.fichaIdentificacion,
                            ansiedadScore: typeof data.ansiedadScore === 'number' ? data.ansiedadScore : undefined,
                            suicideRiskLevel: data.suicideRiskLevel,
                            irc: typeof data.irc === 'number' ? data.irc : undefined,
                            nivelRiesgo: data.nivelRiesgo,
                            evaluaciones: Array.isArray(data.evaluaciones) ? data.evaluaciones : [],
                            notas: Array.isArray(data.notas) ? data.notas : [],
                        };

                        if (!isCancelled) {
                            setExpedienteDinamico(exp);
                            setStudent(expedienteToStudent(exp));
                        }
                        return;
                    }

                    const q = query(collection(db, nombreColeccion), where('studentId', '==', studentId), limit(1));
                    const snap = await getDocs(q);
                    const primerDoc = snap.docs[0];
                    if (primerDoc) {
                        const data = primerDoc.data() as Partial<ExpedienteType> & Record<string, any>;
                        const exp: ExpedienteType = {
                            id: data.id || primerDoc.id,
                            studentId: data.studentId || primerDoc.id,
                            studentName: data.studentName || data.nombreCompleto || data.name || 'Sin nombre',
                            groupName: data.groupName || data.grupoNombre || data.group || 'Sin grupo',
                            semester: Number(data.semester || data.semestre || 1),
                            nivel: (data.nivel as any) || 'nivel_1',
                            estado: (data.estado as any) || 'abierto',
                            origen: (data.origen as any) || 'registro_manual',
                            fechaCreacion: data.fechaCreacion || new Date().toISOString(),
                            fechaActualizacion: data.fechaActualizacion || new Date().toISOString(),
                            creadoPor: data.creadoPor || 'sistema',
                            academicData: {
                                gpa: Number(data.academicData?.gpa || data.gpa || 0),
                                absences: Number(data.academicData?.absences || data.absences || 0),
                            },
                            fichaIdentificacion: data.fichaIdentificacion,
                            ansiedadScore: typeof data.ansiedadScore === 'number' ? data.ansiedadScore : undefined,
                            suicideRiskLevel: data.suicideRiskLevel,
                            irc: typeof data.irc === 'number' ? data.irc : undefined,
                            nivelRiesgo: data.nivelRiesgo,
                            evaluaciones: Array.isArray(data.evaluaciones) ? data.evaluaciones : [],
                            notas: Array.isArray(data.notas) ? data.notas : [],
                        };

                        if (!isCancelled) {
                            setExpedienteDinamico(exp);
                            setStudent(expedienteToStudent(exp));
                        }
                        return;
                    }
                }

                if (!isCancelled) {
                    setStudent(undefined);
                    setExpedienteDinamico(undefined);
                }
            } catch (error) {
                console.error('Error cargando expediente remoto:', error);
                if (!isCancelled) {
                    setStudent(undefined);
                    setExpedienteDinamico(undefined);
                }
            } finally {
                if (!isCancelled) {
                    setLoadingRemoteExpediente(false);
                }
            }
        };

        cargarExpedienteRemoto();

        return () => {
            isCancelled = true;
        };
    }, [authLoading, studentId, user]);

    useEffect(() => {
        if (role && role !== 'loading' && role !== 'Clinico') {
            console.log(`ACCESO DENEGADO: Rol '${role}' intentó acceder a ruta clínica. Redirigiendo.`);
            redirect(`/educativa/estudiante/${studentId}`);
        }
    }, [role, studentId]);
    
    if (role === 'loading' || authLoading || loadingRemoteExpediente || (!student && !expedienteDinamico)) {
        return (
            <div className="flex h-screen w-full items-center justify-center p-8">
                <div className="flex items-center gap-2 text-xl text-gray-600">
                    <Loader className="animate-spin" />
                    {role === 'loading' || authLoading ? 'Verificando Permisos de Seguridad...' : 'Cargando datos del estudiante...'}
                </div>
            </div>
        );
    }
    
    if (role !== 'Clinico') {
        return null;
    }

    // Usar datos del estudiante encontrado (demo o dinámico)
    const studentData = student!;
    const clinicalAssessment = getClinicalAssessmentByStudentId(studentId);
    const functionalAnalysis = getFunctionalAnalysisByStudentId(studentId);
    const treatmentPlan = getTreatmentPlanByStudentId(studentId);
    const progressTracking = getProgressTrackingByStudentId(studentId);

    const isHighRisk = studentData.suicideRiskLevel === 'Alto' || studentData.suicideRiskLevel === 'Crítico';

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                 <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-red-700">EXPEDIENTE CLÍNICO NIVEL 3 - CONFIDENCIAL</h1>
                    <p className="text-md text-gray-500">{studentData.name}</p>
                </div>
                
                {isHighRisk && (
                    <Alert variant="destructive" className="mb-8">
                        <ShieldAlert className="h-4 w-4" />
                        <AlertTitle>
                            {studentData.suicideRiskLevel === 'Crítico' ? 'Alerta de Riesgo Crítico (Código Rojo)' : 'Alerta de Riesgo Alto'}
                        </AlertTitle>
                        <AlertDescription>
                            Este caso está marcado con Riesgo Suicida '{studentData.suicideRiskLevel}'. Se debe priorizar la aplicación inmediata del Plan de Seguridad y la canalización externa de emergencia (Criterio A/B).
                        </AlertDescription>
                    </Alert>
                )}

                <Alert className="mb-8 border-yellow-500 text-yellow-800">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Disclaimer Deontológico (Cap. 1.5)</AlertTitle>
                    <AlertDescription>
                        El resultado de este expediente (IRC, BDI, etc.) constituye una Alerta de Riesgo y una <strong>Impresión Diagnóstica Provisional</strong>, no un diagnóstico nosológico definitivo.
                    </AlertDescription>
                </Alert>

                <Tabs defaultValue="resumen" className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="identificacion"><UserCheck className="mr-2"/>Ficha de Identificación</TabsTrigger>
                        <TabsTrigger value="resumen"><Activity className="mr-2"/>Resumen Ejecutivo</TabsTrigger>
                        <TabsTrigger value="pruebas"><TestTube2 className="mr-2"/>Banco de Pruebas</TabsTrigger>
                        <TabsTrigger value="soap"><FileText className="mr-2"/>Evolución y Notas</TabsTrigger>
                        <TabsTrigger value="documentacion"><FileDown className="mr-2"/>Documentación Legal</TabsTrigger>
                    </TabsList>

                    <TabsContent value="identificacion" className="mt-6">
                        <StudentIdentificationCard student={studentData} expediente={expedienteDinamico} />
                    </TabsContent>
                    
                    <TabsContent value="resumen" className="mt-6 space-y-12">
                        <ClinicalAssessmentForm initialData={clinicalAssessment} studentId={studentId} expediente={expedienteDinamico} />
                        <FunctionalAnalysisForm studentName={studentData.name} initialData={functionalAnalysis} />
                        <TreatmentPlanGenerator
                            studentId={studentId}
                            studentName={studentData.name}
                            clinicalAssessment={clinicalAssessment}
                            functionalAnalysis={functionalAnalysis}
                            expediente={expedienteDinamico}
                            initialData={treatmentPlan}
                        />
                        <PIEIGenerator clinicalData={clinicalAssessment} />
                        <ProgressTracker initialData={progressTracking} />
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <ClinicalKPILogger />
                            <RiskTimelineChart />
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="pruebas" className="mt-6 space-y-12">
                         <BancoDePruebas
                            studentId={studentId}
                            studentName={studentData.name}
                            groupName={studentData.demographics.group}
                                     studentMatricula={(studentData as any).demographics?.matricula || studentId}
                        />

                        <Card>
                           <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BookOpen />
                                    Consola de Aplicación: Evaluación Psicométrica
                                </CardTitle>
                                <CardDescription>
                                     El sistema seleccionará automáticamente la escala Wechsler apropiada según la edad cronológica del evaluado, que es de <strong>{studentData.demographics.age} años</strong>.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center justify-center p-6">
                                <Button asChild size="lg">
                                    <Link href={`/consola/${studentId}`} target="_blank">
                                        Iniciar Aplicación Presencial ({studentData.demographics.age < 17 ? 'WISC-V' : 'WAIS-IV'})
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BrainCircuit />
                                    Consola de Aplicación: Tamizaje Neuropsicológico
                                </CardTitle>
                                <CardDescription>Herramienta para el registro en tiempo real de pruebas de atención y funciones ejecutivas.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <NeuroScreeningConsole studentId={studentId} />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="soap" className="mt-6">
                        <SOAPNotesForm />
                    </TabsContent>

                    <TabsContent value="documentacion" className="mt-6">
                         <ReportGenerator student={studentData} clinicalAssessment={clinicalAssessment} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
