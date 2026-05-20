'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserPlus, RefreshCw, UserCog, Bug, Copy, Trash2, Users, ChevronRight } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { saveExpedienteLocal } from '@/lib/storage-local';

const RUNTIME_ERRORS_KEY = 'pigec_runtime_errors';

type RuntimeErrorEntry = {
    timestamp: string;
    message: string;
    digest?: string | null;
    stack?: string;
    path?: string;
};


// Función que guarda localmente en localStorage
async function addNewStudent(data: { studentId: string; studentName: string; group: string; dualRelationship: string; }) {
    const ahora = new Date().toISOString();

    saveExpedienteLocal({
        id: data.studentId,
        studentId: data.studentId,
        studentName: data.studentName,
        groupName: data.group,
        semester: 1,
        nivel: 'nivel_1',
        estado: 'abierto',
        origen: 'registro_manual',
        fechaCreacion: ahora,
        fechaActualizacion: ahora,
        creadoPor: 'usuario@local',
        academicData: {
            gpa: 0,
            absences: 0,
        },
        evaluaciones: [],
        notas: [
            {
                id: `nota-${Date.now()}`,
                fecha: ahora,
                autor: 'Sistema',
                contenido: data.dualRelationship || 'Expediente creado localmente desde Administración.',
            },
        ],
    });

    return { success: true, studentId: data.studentId };
}


function AddNewStudentForm() {
    const [studentId, setStudentId] = useState('');
    const [studentName, setStudentName] = useState('');
    const [group, setGroup] = useState('');
    const [dualRelationship, setDualRelationship] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsLoading(true);
        setFeedback(null);

        if (!studentId || !studentName || !group) {
            setFeedback({ type: 'error', message: 'Los campos de ID, Nombre y Grupo son obligatorios.' });
            setIsLoading(false);
            return;
        }

        try {
            const result = await addNewStudent({ studentId, studentName, group, dualRelationship });
            if (result.success) {
                setFeedback({ type: 'success', message: 'Expediente guardado localmente' });
                setStudentId('');
                setStudentName('');
                setGroup('');
                setDualRelationship('');
            } else {
                 setFeedback({ type: 'error', message: 'Ocurrió un error al guardar el estudiante.' });
            }
        } catch (error) {
             setFeedback({ type: 'error', message: 'No se pudo crear el expediente local.' });
             console.error('Error al guardar expediente local:', error);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-6 w-6" />
                    Ingresar Nuevo Estudiante
                </CardTitle>
                <CardDescription>
                    Crea un nuevo expediente digital en almacenamiento local.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="student-id">ID del Estudiante (Matrícula)</Label>
                        <Input id="student-id" value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="Ej. 2024001" required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="student-name">Nombre Completo del Estudiante</Label>
                        <Input id="student-name" value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="Ej. Juan Pérez López" required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="group">Grupo</Label>
                        <Input id="group" value={group} onChange={(e) => setGroup(e.target.value)} placeholder="Ej. 5B" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="dual-relationship">Trazabilidad de Relación Dual (Cap. 4.3)</Label>
                        <Textarea id="dual-relationship" value={dualRelationship} onChange={(e) => setDualRelationship(e.target.value)} placeholder="¿Existe relación académica o familiar directa con el tutor/clínico asignado? Documentar aquí." />
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                            {isLoading ? 'Guardando...' : 'Crear Expediente'}
                        </Button>
                    </div>
                </form>

                {feedback && (
                    <div className={`mt-4 p-3 rounded-md text-sm ${feedback.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {feedback.message}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function RoleManagementCard() {
    const [users, setUsers] = useState([
        { uid: 'user001', email: 'psic.martinez@example.com', role: 'Clinico' },
        { uid: 'user002', email: 'orientador.gomez@example.com', role: 'Orientador' },
        { uid: 'user003', email: 'nuevo.docente@example.com', role: 'none' },
    ]);

    const handleRoleChange = (uid: string, newRole: string) => {
        setUsers(users.map(user => user.uid === uid ? { ...user, role: newRole } : user));
    };
    
    const handleSaveChanges = () => {
        console.log("--- SIMULACIÓN: Guardando Cambios de Roles ---");
        console.log("Estos datos serían enviados a una Cloud Function para establecer Custom Claims en Firebase Auth.");
        console.log(users);
        alert("Simulación de guardado de roles completada. Revisa la consola para más detalles.");
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <UserCog className="h-6 w-6" />
                    Gestión de Roles de Usuario
                </CardTitle>
                <CardDescription>
                    Asigne los roles de 'Clinico' u 'Orientador' a los usuarios del sistema.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {users.map(user => (
                        <div key={user.uid} className="flex items-center justify-between p-2 border rounded-md">
                            <span className="text-sm font-medium">{user.email}</span>
                            <Select value={user.role} onValueChange={(newRole) => handleRoleChange(user.uid, newRole)}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Seleccionar rol" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Clinico">Clínico</SelectItem>
                                    <SelectItem value="Orientador">Orientador</SelectItem>
                                    <SelectItem value="none">Sin Rol</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    ))}
                </div>
                 <div className="flex justify-end mt-6">
                    <Button onClick={handleSaveChanges}>Guardar Cambios de Roles</Button>
                </div>
            </CardContent>
        </Card>
    );
}

function RuntimeErrorConsoleCard() {
    const [errors, setErrors] = useState<RuntimeErrorEntry[]>([]);

    const readErrors = () => {
        if (typeof window === 'undefined') return;
        try {
            const raw = localStorage.getItem(RUNTIME_ERRORS_KEY) || '[]';
            const parsed = JSON.parse(raw);
            setErrors(Array.isArray(parsed) ? parsed : []);
        } catch {
            setErrors([]);
        }
    };

    useEffect(() => {
        readErrors();
    }, []);

    const handleClear = () => {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(RUNTIME_ERRORS_KEY);
        setErrors([]);
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(JSON.stringify(errors, null, 2));
            alert('Errores copiados al portapapeles.');
        } catch {
            alert('No se pudieron copiar los errores.');
        }
    };

    return (
        <Card className="w-full lg:col-span-2 border-red-200">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bug className="h-5 w-5 text-red-600" />
                    Consola Rápida de Errores Runtime
                </CardTitle>
                <CardDescription>
                    Muestra errores capturados automáticamente cuando aparece “Error Inesperado”.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" onClick={readErrors}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Recargar
                    </Button>
                    <Button variant="outline" onClick={handleCopy} disabled={errors.length === 0}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar JSON
                    </Button>
                    <Button variant="destructive" onClick={handleClear} disabled={errors.length === 0}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Limpiar
                    </Button>
                    <Link href="/admin/debug" className="text-sm text-blue-600 hover:underline ml-auto">
                        Abrir Consola Avanzada
                    </Link>
                </div>

                {errors.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin errores registrados en este dispositivo.</p>
                ) : (
                    <div className="space-y-2 max-h-[380px] overflow-auto">
                        {errors.map((entry, idx) => (
                            <div key={`${entry.timestamp}-${idx}`} className="rounded border border-red-100 bg-red-50 p-3">
                                <p className="text-xs text-red-700">{new Date(entry.timestamp).toLocaleString()}</p>
                                <p className="text-sm font-semibold text-red-900 break-all">{entry.message || 'Sin mensaje'}</p>
                                <p className="text-xs text-red-800">Ruta: {entry.path || 'N/D'}</p>
                                {entry.digest ? <p className="text-xs text-red-800">Digest: {entry.digest}</p> : null}
                                {entry.stack ? (
                                    <pre className="mt-2 text-xs bg-white/70 border rounded p-2 overflow-x-auto">{entry.stack}</pre>
                                ) : null}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default function AdminPage() {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">
                Módulo de Administración
            </h1>
            <p className="mb-8 text-sm text-gray-600">
                Gestión de expedientes, usuarios y roles del sistema MTSS.
            </p>

            {/* === NAVEGACIÓN A SECCIONES === */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <Link href="/admin/official-groups" className="group">
                    <Card className="h-full transition-all hover:shadow-lg hover:border-primary/50 cursor-pointer">
                        <CardContent className="flex items-center justify-between p-6">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 text-primary">
                                    <Users className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="font-semibold text-lg">Gestión de Grupos</p>
                                    <p className="text-sm text-muted-foreground">Crear grupos oficiales, agregar estudiantes y gestionar evaluaciones masivas</p>
                                </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* === SECCIONES DE ADMINISTRACIÓN === */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <AddNewStudentForm />
                <RoleManagementCard />
                <RuntimeErrorConsoleCard />
            </div>
        </div>
    );
}
