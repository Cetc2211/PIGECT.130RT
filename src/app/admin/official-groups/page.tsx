'use client';

import React, { useState, useEffect } from 'react';
import { useData } from '@/hooks/use-data';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Users, Bell, FileCheck, Calendar as CalendarIcon, Search, Trash2, Download, Pencil, Eye, UserPlus, ChevronRight, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { OfficialGroup, Student, JustificationCategory } from '@/lib/placeholder-data';
import { format, addHours, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { decodeEvaluationPayload } from '@/lib/data-utils';
import { saveOfficialGroupStructure, saveImportedWhatsAppEvaluation } from '@/lib/storage-local';

export default function OfficialGroupsPage() {
    const { 
        officialGroups, 
        createOfficialGroup, 
        updateOfficialGroupTutor,
        deleteOfficialGroup,
        renameOfficialGroup,
        addStudentsToOfficialGroup, 
        removeStudentFromOfficialGroup,
        getOfficialGroupStudents,
        createAnnouncement,
        deleteAnnouncement, 
        createJustification,
        announcements,
        justifications
    } = useData();
    const { toast } = useToast();

    // Group Management State
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupTutorEmail, setNewGroupTutorEmail] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [activeGroup, setActiveGroup] = useState<OfficialGroup | null>(null);
    const [isAddStudentDialogOpen, setIsAddStudentDialogOpen] = useState(false);
    
    // Student management for selected group
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [groupStudents, setGroupStudents] = useState<Student[]>([]);
    const [isLoadingGroupStudents, setIsLoadingGroupStudents] = useState(false);
    const [studentToRemove, setStudentToRemove] = useState<{groupId: string, studentId: string, studentName: string} | null>(null);
    const [isRenamingGroup, setIsRenamingGroup] = useState(false);
    const [renamingGroupId, setRenamingGroupId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Group deletion confirmation
    const [groupToDelete, setGroupToDelete] = useState<{id: string, name: string} | null>(null);

    // Edit Tutor State
    const [editingTutorGroupId, setEditingTutorGroupId] = useState<string | null>(null);
    const [editingTutorEmail, setEditingTutorEmail] = useState('');
    const [isSavingTutor, setIsSavingTutor] = useState(false);
    
    // Student Import State
    const [bulkNames, setBulkNames] = useState('');
    const [bulkEmails, setBulkEmails] = useState('');
    const [bulkPhones, setBulkPhones] = useState('');
    const [bulkTutorNames, setBulkTutorNames] = useState('');
    const [bulkTutorPhones, setBulkTutorPhones] = useState('');
    const [isSubmittingStudents, setIsSubmittingStudents] = useState(false);

    // Announcement State
    const [annTitle, setAnnTitle] = useState('');
    const [annContent, setAnnContent] = useState('');
    const [annDuration, setAnnDuration] = useState('48');
    const [isSubmittingAnn, setIsSubmittingAnn] = useState(false);

    // Justification State
    const [justGroupId, setJustGroupId] = useState<string>('');
    const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);
    const [justStudentId, setJustStudentId] = useState<string>('');
    const [justDate, setJustDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [justReason, setJustReason] = useState('');
    const [justCategory, setJustCategory] = useState<JustificationCategory>('Salud');
    const [isSubmittingJust, setIsSubmittingJust] = useState(false);

    // WhatsApp Import State
    const [whatsAppCodeInput, setWhatsAppCodeInput] = useState('');
    const [isImportingWhatsApp, setIsImportingWhatsApp] = useState(false);
    const [whatsAppImportSummary, setWhatsAppImportSummary] = useState<string | null>(null);

    // --- Handlers ---

    const loadGroupStudents = async (groupId: string) => {
        setSelectedGroupId(groupId);
        setIsLoadingGroupStudents(true);
        try {
            const students = await getOfficialGroupStudents(groupId);
            setGroupStudents(students.sort((a, b) => a.name.localeCompare(b.name)));
        } catch (e) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los estudiantes.' });
        } finally {
            setIsLoadingGroupStudents(false);
        }
    };

    const handleRenameGroup = async () => {
        if (!renamingGroupId || !renameValue.trim()) return;
        setIsRenamingGroup(true);
        try {
            await renameOfficialGroup(renamingGroupId, renameValue.trim());
            toast({ title: 'Grupo renombrado', description: `Nombre actualizado a "${renameValue.trim()}"` });
            setRenamingGroupId(null);
            setRenameValue('');
        } catch (e) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo renombrar el grupo.' });
        } finally {
            setIsRenamingGroup(false);
        }
    };

    const handleRemoveStudent = async () => {
        if (!studentToRemove) return;
        try {
            await removeStudentFromOfficialGroup(studentToRemove.groupId, studentToRemove.studentId);
            setGroupStudents(prev => prev.filter(s => s.id !== studentToRemove.studentId));
            toast({ title: 'Estudiante eliminado', description: `${studentToRemove.studentName} fue removido del grupo.` });
            setStudentToRemove(null);
        } catch (e) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar el estudiante.' });
        }
    };

    const handleConfirmDeleteGroup = async () => {
        if (!groupToDelete) return;
        try {
            await deleteOfficialGroup(groupToDelete.id);
            toast({ title: 'Grupo eliminado', description: `El grupo ${groupToDelete.name} ha sido eliminado.` });
            if (selectedGroupId === groupToDelete.id) {
                setSelectedGroupId(null);
                setGroupStudents([]);
            }
            setGroupToDelete(null);
        } catch (e) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar el grupo.' });
        }
    };

    const guardarGrupoOficialEnNavegador = (group: OfficialGroup) => {
        saveOfficialGroupStructure(group);
    };

    // Fetch students when group selected for Justification
    useEffect(() => {
        if (!justGroupId || !getOfficialGroupStudents) {
            setAvailableStudents([]);
            return;
        } 
        
        const loadStudents = async () => {
            setIsLoadingStudents(true);
            try {
                const students = await getOfficialGroupStudents(justGroupId);
                setAvailableStudents(students.sort((a,b) => a.name.localeCompare(b.name)));
            } catch (e) {
                console.error("Error loading students", e);
                toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los estudiantes.' });
            } finally {
                setIsLoadingStudents(false);
            }
        };
        loadStudents();
    }, [justGroupId, getOfficialGroupStudents, toast]);


    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) return;
        setIsCreating(true);
        try {
            const newId = await createOfficialGroup(newGroupName, newGroupTutorEmail);
            setNewGroupName('');
            setNewGroupTutorEmail('');
            toast({ title: 'Grupo oficial creado', description: 'Ahora puedes agregar estudiantes.' });
            
            const newGroupObj: OfficialGroup = { 
                id: newId, 
                name: newGroupName, 
                createdAt: new Date().toISOString(),
                tutorEmail: newGroupTutorEmail || undefined,
                studentIds: [],
            };

            guardarGrupoOficialEnNavegador(newGroupObj);
            handleOpenAddStudents(newGroupObj);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo crear el grupo' });
        } finally {
            setIsCreating(false);
        }
    };

    const handleUpdateTutor = async (groupId: string) => {
        if (!editingTutorEmail.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Ingresa un correo valido.' });
            return;
        }
        setIsSavingTutor(true);
        try {
            await updateOfficialGroupTutor(groupId, editingTutorEmail.trim());
            toast({ title: 'Tutor asignado', description: `El tutor con correo ${editingTutorEmail} ha sido asignado al grupo.` });
            setEditingTutorGroupId(null);
            setEditingTutorEmail('');
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo asignar el tutor.' });
        } finally {
            setIsSavingTutor(false);
        }
    };

    const startEditingTutor = (group: OfficialGroup) => {
        setEditingTutorGroupId(group.id);
        setEditingTutorEmail(group.tutorEmail || '');
    };

    const handleOpenAddStudents = (group: OfficialGroup) => {
        setActiveGroup(group);
        setBulkNames('');
        setBulkEmails('');
        setBulkPhones('');
        setBulkTutorNames('');
        setBulkTutorPhones('');
        setIsAddStudentDialogOpen(true);
    };

    const handleAddStudents = async () => {
        if (!activeGroup) return;

        const names = bulkNames.trim().split('\n').filter((name: string) => name);
        const emails = bulkEmails.trim().split('\n');
        const phones = bulkPhones.trim().split('\n');
        const tutorNames = bulkTutorNames.trim().split('\n');
        const tutorPhones = bulkTutorPhones.trim().split('\n');

        if (names.length === 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'Ingresa al menos un nombre.' });
            return;
        }

        setIsSubmittingStudents(true);
        try {
            const newStudents: Student[] = names.map((name: string, index: number) => ({
                id: `S${Date.now()}-${Math.random().toString(36).substr(2, 5)}-${index}`,
                name: name.trim(),
                email: emails[index]?.trim() || '',
                phone: phones[index]?.trim() || '',
                tutorName: tutorNames[index]?.trim() || '',
                tutorPhone: tutorPhones[index]?.trim() || '',
                photo: 'https://placehold.co/100x100.png',
            }));

            await addStudentsToOfficialGroup(activeGroup.id, newStudents);
            toast({ title: 'Estudiantes agregados', description: `${newStudents.length} añadidos.` });
            setIsAddStudentDialogOpen(false);
            
            // Reload students if this group is currently selected
            if (selectedGroupId === activeGroup.id) {
                await loadGroupStudents(activeGroup.id);
            }
        } catch (e) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Error', description: 'Fallo la carga de estudiantes.' });
        } finally {
            setIsSubmittingStudents(false);
        }
    };

    const handleDeleteAnnouncement = async (id: string) => {
        if (!confirm('Eliminar este anuncio?')) return;
        try {
            await deleteAnnouncement(id);
            toast({ title: 'Anuncio eliminado', description: 'El anuncio ha sido retirado.' });
        } catch (e) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar el anuncio.' });
        }
    };

    const handleCreateAnnouncement = async () => {
        if (!annTitle.trim() || !annContent.trim()) return;
        setIsSubmittingAnn(true);
        try {
            const now = new Date();
            const hours = parseInt(annDuration);
            const expiresAt = addHours(now, hours).toISOString();
            
            await createAnnouncement(annTitle, annContent, undefined, expiresAt);
            setAnnTitle('');
            setAnnContent('');
            setAnnDuration('48');
            toast({ title: 'Anuncio Publicado', description: 'Visible para todos los usuarios.' });
        } catch (e) { 
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo crear el anuncio.' });
        } finally {
            setIsSubmittingAnn(false);
        }
    };

    const handleCreateJustification = async () => {
        if (!justStudentId || !justDate || !justReason.trim()) {
             toast({ variant: 'destructive', title: 'Faltan datos', description: 'Selecciona estudiante, fecha y motivo.' });
             return;
        }
        setIsSubmittingJust(true);
        try {
            await createJustification(justStudentId, justDate, justReason, justCategory);
            setJustReason('');
            toast({ title: 'Justificacion Creada', description: 'Se reflejara en la asistencia.' });
        } catch (e) {
             toast({ variant: 'destructive', title: 'Error', description: 'No se pudo crear la justificacion.' });
        } finally {
            setIsSubmittingJust(false);
        }
    };

    const handleExportCSV = () => {
        if (!selectedGroupId || groupStudents.length === 0) return;
        const group = officialGroups.find(g => g.id === selectedGroupId);
        const header = 'Nombre,Correo,Telefono,Tutor,Telefono Tutor\n';
        const rows = groupStudents.map(s => 
            `"${s.name}","${s.email || ''}","${s.phone || ''}","${s.tutorName || ''}","${s.tutorPhone || ''}"`
        ).join('\n');
        const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${group?.name || 'grupo'}_estudiantes.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast({ title: 'Lista exportada', description: `${groupStudents.length} estudiantes exportados.` });
    };

    const extractWhatsAppBridgeCode = (raw: string): string => {
        const trimmed = raw.trim();
        const prefixed = trimmed.match(/PIGEC-WA1:([A-Za-z0-9+/=._-]+)/i);
        if (prefixed?.[1]) {
            return prefixed[1];
        }
        return trimmed.replace(/^PIGEC-WA1:/i, '').trim();
    };

    const handleImportFromWhatsApp = async () => {
        if (!whatsAppCodeInput.trim()) {
            toast({ variant: 'destructive', title: 'Codigo vacio', description: 'Pega el codigo del mensaje de WhatsApp.' });
            return;
        }

        setIsImportingWhatsApp(true);
        setWhatsAppImportSummary(null);

        try {
            const code = extractWhatsAppBridgeCode(whatsAppCodeInput);
            const payload = await decodeEvaluationPayload(code);
            const importId = saveImportedWhatsAppEvaluation(payload);

            const studentName = payload.student?.name || 'Consultante sin nombre';
            const testsCount = payload.completedTests?.length || Object.keys(payload.results || {}).length;
            const summary = `Importacion ${importId}: ${studentName} · ${testsCount} pruebas guardadas en modo local.`;

            setWhatsAppImportSummary(summary);
            toast({ title: 'Importacion completada', description: 'Los datos se guardaron en localStorage.' });
        } catch (error) {
            console.error('Error importando codigo de WhatsApp:', error);
            toast({ variant: 'destructive', title: 'Error de importacion', description: 'No se pudo decodificar el codigo de WhatsApp.' });
        } finally {
            setIsImportingWhatsApp(false);
        }
    };

    const filteredStudents = searchQuery.trim()
        ? groupStudents.filter(s => 
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.email && s.email.toLowerCase().includes(searchQuery.toLowerCase()))
          )
        : groupStudents;

    const selectedGroup = officialGroups.find(g => g.id === selectedGroupId);

    return (
        <div className="container mx-auto py-8">
            <div className="flex items-center justify-between mb-8">
                 <h1 className="text-3xl font-bold">Panel de Administracion</h1>
            </div>
            
            <Tabs defaultValue="groups" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-8">
                    <TabsTrigger value="groups">Grupos Oficiales</TabsTrigger>
                    <TabsTrigger value="justifications">Justificantes</TabsTrigger>
                    <TabsTrigger value="announcements">Anuncios Generales</TabsTrigger>
                    <TabsTrigger value="import-whatsapp">Importar WhatsApp</TabsTrigger>
                </TabsList>

                {/* ========== GROUPS TAB — Two Panel Layout ========== */}
                <TabsContent value="groups">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        
                        {/* LEFT PANEL — Group List */}
                        <div className="lg:col-span-4 space-y-4">
                            {/* Create New Group Card */}
                            <Card className="bg-muted/50 border-dashed">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">Crear Nuevo Grupo</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="groupName" className="text-xs">Nombre del Grupo</Label>
                                        <Input 
                                            id="groupName" 
                                            value={newGroupName} 
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewGroupName(e.target.value)} 
                                            placeholder="ej. 1-A TSPA"
                                            className="h-9"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="tutorEmail" className="text-xs">Correo del Tutor (opcional)</Label>
                                        <Input 
                                            id="tutorEmail" 
                                            type="email"
                                            value={newGroupTutorEmail} 
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewGroupTutorEmail(e.target.value)} 
                                            placeholder="tutor@ejemplo.com"
                                            className="h-9"
                                        />
                                    </div>
                                    <Button onClick={handleCreateGroup} disabled={!newGroupName.trim() || isCreating} size="sm" className="w-full">
                                        {isCreating && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                        Crear Grupo
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Group List */}
                            <div className="space-y-2 max-h-[calc(100vh-380px)] overflow-y-auto pr-1">
                                {officialGroups.length === 0 && (
                                    <div className="text-center text-muted-foreground py-8 text-sm">
                                        No hay grupos creados. Crea uno para comenzar.
                                    </div>
                                )}
                                {officialGroups.map(group => (
                                    <Card 
                                        key={group.id} 
                                        className={`cursor-pointer transition-all hover:shadow-md ${
                                            selectedGroupId === group.id 
                                                ? 'ring-2 ring-primary border-primary' 
                                                : ''
                                        }`}
                                        onClick={() => loadGroupStudents(group.id)}
                                    >
                                        <CardContent className="p-3">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        {renamingGroupId === group.id ? (
                                                            <Input
                                                                value={renameValue}
                                                                onChange={(e) => setRenameValue(e.target.value)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') handleRenameGroup();
                                                                    if (e.key === 'Escape') { setRenamingGroupId(null); setRenameValue(''); }
                                                                }}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="h-7 text-sm"
                                                                autoFocus
                                                            />
                                                        ) : (
                                                            <span className="font-semibold text-sm truncate">{group.name}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                                            <Users className="h-3 w-3 mr-1" />
                                                            {(group.studentIds || []).length}
                                                        </Badge>
                                                        {group.tutorEmail && (
                                                            <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                                                                {group.tutorEmail}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground mt-0.5">
                                                        {format(new Date(group.createdAt), 'dd/MM/yyyy')}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                                    {renamingGroupId === group.id ? (
                                                        <>
                                                            <Button 
                                                                size="icon" 
                                                                variant="ghost" 
                                                                className="h-7 w-7"
                                                                onClick={() => handleRenameGroup()}
                                                                disabled={isRenamingGroup || !renameValue.trim()}
                                                            >
                                                                {isRenamingGroup ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}
                                                            </Button>
                                                            <Button 
                                                                size="icon" 
                                                                variant="ghost" 
                                                                className="h-7 w-7"
                                                                onClick={() => { setRenamingGroupId(null); setRenameValue(''); }}
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Button 
                                                                size="icon" 
                                                                variant="ghost" 
                                                                className="h-7 w-7"
                                                                title="Renombrar"
                                                                onClick={() => { setRenamingGroupId(group.id); setRenameValue(group.name); }}
                                                            >
                                                                <Pencil className="h-3 w-3" />
                                                            </Button>
                                                            <Button 
                                                                size="icon" 
                                                                variant="ghost" 
                                                                className="h-7 w-7"
                                                                title="Agregar Estudiantes"
                                                                onClick={() => handleOpenAddStudents(group)}
                                                            >
                                                                <UserPlus className="h-3 w-3" />
                                                            </Button>
                                                            <Button 
                                                                size="icon" 
                                                                variant="ghost" 
                                                                className="h-7 w-7 text-destructive hover:text-destructive"
                                                                title="Eliminar Grupo"
                                                                onClick={() => setGroupToDelete({ id: group.id, name: group.name })}
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Inline Tutor Edit */}
                                            {editingTutorGroupId === group.id && (
                                                <div className="mt-2 p-2 bg-muted rounded-md space-y-2" onClick={(e) => e.stopPropagation()}>
                                                    <Label className="text-xs">Correo del Tutor</Label>
                                                    <div className="flex gap-2">
                                                        <Input 
                                                            type="email"
                                                            value={editingTutorEmail}
                                                            onChange={(e) => setEditingTutorEmail(e.target.value)}
                                                            placeholder="tutor@ejemplo.com"
                                                            className="h-7 text-xs"
                                                        />
                                                        <Button 
                                                            size="sm" 
                                                            onClick={() => handleUpdateTutor(group.id)}
                                                            disabled={isSavingTutor}
                                                            className="h-7 px-2"
                                                        >
                                                            {isSavingTutor ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Guardar'}
                                                        </Button>
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline"
                                                            onClick={() => setEditingTutorGroupId(null)}
                                                            className="h-7 px-2"
                                                        >
                                                            X
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        {/* RIGHT PANEL — Student Management */}
                        <div className="lg:col-span-8">
                            {!selectedGroupId ? (
                                <Card className="h-full flex items-center justify-center min-h-[400px]">
                                    <div className="text-center text-muted-foreground">
                                        <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                        <p>Selecciona un grupo para ver sus estudiantes</p>
                                    </div>
                                </Card>
                            ) : (
                                <Card>
                                    <CardHeader className="pb-3">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                            <div>
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    {selectedGroup?.name || 'Grupo'}
                                                    <Badge variant="secondary">{groupStudents.length} estudiantes</Badge>
                                                </CardTitle>
                                                <CardDescription className="mt-1">
                                                    {selectedGroup?.tutorEmail && `Tutor: ${selectedGroup.tutorEmail}`}
                                                </CardDescription>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="relative flex-1 sm:w-auto">
                                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        placeholder="Buscar estudiante..."
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        className="pl-8 h-9"
                                                    />
                                                </div>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    onClick={() => selectedGroup && handleOpenAddStudents(selectedGroup)}
                                                >
                                                    <UserPlus className="h-4 w-4 mr-1" />
                                                    Agregar
                                                </Button>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    onClick={handleExportCSV}
                                                    disabled={groupStudents.length === 0}
                                                >
                                                    <Download className="h-4 w-4 mr-1" />
                                                    Exportar
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {isLoadingGroupStudents ? (
                                            <div className="flex items-center justify-center py-12">
                                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                                <span className="ml-2 text-muted-foreground">Cargando estudiantes...</span>
                                            </div>
                                        ) : filteredStudents.length === 0 ? (
                                            <div className="text-center py-12">
                                                {searchQuery.trim() ? (
                                                    <p className="text-muted-foreground">No se encontraron estudiantes para &quot;{searchQuery}&quot;</p>
                                                ) : (
                                                    <>
                                                        <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-30" />
                                                        <p className="text-muted-foreground">Este grupo no tiene estudiantes.</p>
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            className="mt-3"
                                                            onClick={() => selectedGroup && handleOpenAddStudents(selectedGroup)}
                                                        >
                                                            <UserPlus className="h-4 w-4 mr-1" />
                                                            Agregar Estudiantes
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="rounded-md border overflow-hidden max-h-[calc(100vh-420px)] overflow-y-auto">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead className="w-10">#</TableHead>
                                                            <TableHead>Nombre</TableHead>
                                                            <TableHead className="hidden sm:table-cell">Correo</TableHead>
                                                            <TableHead className="hidden md:table-cell">Telefono</TableHead>
                                                            <TableHead className="hidden lg:table-cell">Tutor</TableHead>
                                                            <TableHead className="w-16 text-right">Acciones</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {filteredStudents.map((student, index) => (
                                                            <TableRow key={student.id}>
                                                                <TableCell className="text-muted-foreground font-mono text-xs">
                                                                    {index + 1}
                                                                </TableCell>
                                                                <TableCell className="font-medium">{student.name}</TableCell>
                                                                <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                                                                    {student.email || '—'}
                                                                </TableCell>
                                                                <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                                                                    {student.phone || '—'}
                                                                </TableCell>
                                                                <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                                                                    {student.tutorName || '—'}
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-7 w-7 text-destructive hover:text-destructive"
                                                                        onClick={() => setStudentToRemove({
                                                                            groupId: selectedGroupId!,
                                                                            studentId: student.id,
                                                                            studentName: student.name,
                                                                        })}
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </TabsContent>

                {/* ========== JUSTIFICATIONS TAB ========== */}
                <TabsContent value="justifications">
                     <div className="grid md:grid-cols-2 gap-8">
                         <Card>
                             <CardHeader>
                                 <CardTitle>Nueva Justificacion</CardTitle>
                                 <CardDescription>Registra la inasistencia justificada de un alumno.</CardDescription>
                             </CardHeader>
                             <CardContent className="space-y-4">
                                 <div className="space-y-2">
                                     <Label>1. Seleccionar Grupo</Label>
                                     <Select onValueChange={setJustGroupId} value={justGroupId}>
                                         <SelectTrigger>
                                             <SelectValue placeholder="Selecciona un grupo..." />
                                         </SelectTrigger>
                                         <SelectContent>
                                             {officialGroups.map(g => (
                                                 <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                                             ))}
                                         </SelectContent>
                                     </Select>
                                 </div>

                                 <div className="space-y-2">
                                     <Label>2. Seleccionar Estudiante</Label>
                                     <Select onValueChange={setJustStudentId} value={justStudentId} disabled={!justGroupId || isLoadingStudents}>
                                         <SelectTrigger>
                                              <SelectValue placeholder={isLoadingStudents ? "Cargando..." : "Selecciona un estudiante..."} />
                                         </SelectTrigger>
                                         <SelectContent>
                                             {availableStudents.map(s => (
                                                 <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                             ))}
                                         </SelectContent>
                                     </Select>
                                 </div>

                                 <div className="space-y-2">
                                     <Label>3. Fecha a Justificar</Label>
                                     <Input type="date" value={justDate} onChange={(e) => setJustDate(e.target.value)} />
                                 </div>

                                 <div className="space-y-2">
                                     <Label>4. Categoria del Motivo</Label>
                                     <Select onValueChange={(v) => setJustCategory(v as JustificationCategory)} value={justCategory}>
                                         <SelectTrigger>
                                             <SelectValue placeholder="Selecciona una categoria..." />
                                         </SelectTrigger>
                                         <SelectContent>
                                             <SelectItem value="Salud">Salud</SelectItem>
                                             <SelectItem value="Familiar">Familiar</SelectItem>
                                             <SelectItem value="Personal">Personal</SelectItem>
                                             <SelectItem value="Institucional">Institucional</SelectItem>
                                             <SelectItem value="Otro">Otro</SelectItem>
                                         </SelectContent>
                                     </Select>
                                 </div>

                                 <div className="space-y-2">
                                     <Label>5. Observaciones Detalladas</Label>
                                     <Textarea value={justReason} onChange={(e) => setJustReason(e.target.value)} placeholder="Detalles especificos..." />
                                 </div>

                                 <Button className="w-full" onClick={handleCreateJustification} disabled={isSubmittingJust || !justStudentId}>
                                     {isSubmittingJust && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                     Guardar Justificante
                                 </Button>
                             </CardContent>
                         </Card>

                         <Card>
                             <CardHeader>
                                 <CardTitle>Historial Reciente</CardTitle>
                             </CardHeader>
                             <CardContent>
                                 <div className="space-y-4 max-h-96 overflow-y-auto">
                                     {justifications.length === 0 && <div className="text-muted-foreground text-center py-4">No hay justificaciones recientes.</div>}
                                     {justifications.map((just) => (
                                         <div key={just.id} className="flex items-start justify-between p-3 border rounded-lg">
                                             <div>
                                                 <p className="font-semibold text-sm">Estudiante: {just.studentId}</p>
                                                 <p className="text-xs text-muted-foreground">Fecha: {just.date}</p>
                                                 <p className="text-sm mt-1">{just.reason}</p>
                                             </div>
                                             <FileCheck className="h-4 w-4 text-green-500" />
                                         </div>
                                     ))}
                                 </div>
                             </CardContent>
                         </Card>
                     </div>
                </TabsContent>

                {/* ========== ANNOUNCEMENTS TAB ========== */}
                <TabsContent value="announcements">
                    <div className="grid md:grid-cols-2 gap-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>Publicar Anuncio</CardTitle>
                                <CardDescription>Este mensaje aparecera en el Dashboard principal.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Titulo</Label>
                                    <Input value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} placeholder="Aviso Importante" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Contenido</Label>
                                    <Textarea value={annContent} onChange={(e) => setAnnContent(e.target.value)} placeholder="Detalles del anuncio..." rows={4} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Duracion de la publicacion</Label>
                                    <Select value={annDuration} onValueChange={setAnnDuration}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona duracion" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="24">24 Horas</SelectItem>
                                            <SelectItem value="48">48 Horas</SelectItem>
                                            <SelectItem value="72">72 Horas (3 dias)</SelectItem>
                                            <SelectItem value="168">1 Semana</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button className="w-full" onClick={handleCreateAnnouncement} disabled={isSubmittingAnn || !annTitle}>
                                    {isSubmittingAnn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Publicar Anuncio
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Anuncios Activos</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4 max-h-96 overflow-y-auto">
                                    {announcements.length === 0 && <div className="text-muted-foreground text-center py-4">No hay anuncios activos.</div>}
                                    {announcements.map((ann) => (
                                        <div key={ann.id} className="p-4 border rounded-lg bg-accent/10 relative group">
                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteAnnouncement(ann.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="flex items-center justify-between mb-2 pr-6">
                                                <h4 className="font-bold">{ann.title}</h4>
                                                <span className="text-xs text-muted-foreground">{new Date(ann.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-sm">{ann.message}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* ========== WHATSAPP IMPORT TAB ========== */}
                <TabsContent value="import-whatsapp">
                    <Card>
                        <CardHeader>
                            <CardTitle>Importar desde WhatsApp</CardTitle>
                            <CardDescription>
                                Pega el codigo completo del mensaje (incluyendo o no el prefijo PIGEC-WA1:).
                                La app lo decodifica y lo guarda automaticamente en localStorage.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="whatsappImportCode">Codigo del mensaje</Label>
                                <Textarea
                                    id="whatsappImportCode"
                                    rows={8}
                                    value={whatsAppCodeInput}
                                    onChange={(e) => setWhatsAppCodeInput(e.target.value)}
                                    placeholder="Pega aqui el texto con PIGEC-WA1:..."
                                />
                            </div>

                            <Button
                                onClick={handleImportFromWhatsApp}
                                disabled={isImportingWhatsApp || !whatsAppCodeInput.trim()}
                            >
                                {isImportingWhatsApp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Procesar e Importar
                            </Button>

                            {whatsAppImportSummary && (
                                <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                                    {whatsAppImportSummary}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* ========== ADD STUDENTS DIALOG ========== */}
            <Dialog open={isAddStudentDialogOpen} onOpenChange={setIsAddStudentDialogOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Agregar Estudiantes a {activeGroup?.name}</DialogTitle>
                        <DialogDescription>Copia y pega las columnas desde Excel.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 max-h-[400px] overflow-y-auto">
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Nombres*</Label>
                                <Textarea placeholder="Lista de Nombres" rows={10} value={bulkNames} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBulkNames(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Correos</Label>
                                <Textarea placeholder="Lista de Correos" rows={10} value={bulkEmails} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBulkEmails(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Telefonos</Label>
                                <Textarea placeholder="Lista de Telefonos" rows={10} value={bulkPhones} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBulkPhones(e.target.value)} />
                            </div>
                             <div className="space-y-2">
                                <Label>Tutores (Nombres)</Label>
                                <Textarea placeholder="Nombres de Tutores" rows={10} value={bulkTutorNames} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBulkTutorNames(e.target.value)} />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label>Tutores (Telefonos)</Label>
                                <Textarea placeholder="Telefonos de Tutores" rows={5} value={bulkTutorPhones} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBulkTutorPhones(e.target.value)} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddStudentDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleAddStudents} disabled={isSubmittingStudents || !bulkNames.trim()}>
                             {isSubmittingStudents && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                             Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ========== REMOVE STUDENT ALERT DIALOG ========== */}
            <AlertDialog open={!!studentToRemove} onOpenChange={() => setStudentToRemove(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar estudiante</AlertDialogTitle>
                        <AlertDialogDescription>
                            Estas seguro de que deseas eliminar a &quot;{studentToRemove?.studentName}&quot; del grupo?
                            El expediente del estudiante no se eliminara, solo se desvinculara del grupo.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRemoveStudent} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ========== DELETE GROUP ALERT DIALOG ========== */}
            <AlertDialog open={!!groupToDelete} onOpenChange={() => setGroupToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar grupo</AlertDialogTitle>
                        <AlertDialogDescription>
                            Estas seguro de que deseas eliminar el grupo &quot;{groupToDelete?.name}&quot;?
                            Los estudiantes no se eliminaran, pero se desvincularan del grupo.
                            Esta accion no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDeleteGroup} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Eliminar Grupo
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
