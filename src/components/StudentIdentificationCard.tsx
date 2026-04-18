'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Home, Phone, Shield, Mail, MessageCircle, Calendar, Heart, FileText } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Student } from "@/lib/store";
import { FichaIdentificacionData, Expediente } from "@/lib/expediente-service";

interface StudentIdentificationCardProps {
    student: Student;
    /** Expediente con datos de ficha (si aplica) */
    expediente?: Expediente;
}

const DataField = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: React.ReactNode }) => (
    <div className="flex items-start">
        <div className="w-8 pt-1 text-gray-500">{icon}</div>
        <div className="flex-1">
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className="text-base font-semibold text-gray-800">{value || '—'}</p>
        </div>
    </div>
);

const livingWithLabels: Record<string, string> = {
    ambos: 'Ambos Padres',
    mama: 'Solo Mamá',
    papa: 'Solo Papá',
    abuelos: 'Abuelos',
    otro: 'Otro',
};

export default function StudentIdentificationCard({ student, expediente }: StudentIdentificationCardProps) {
    const ficha = expediente?.fichaIdentificacion;
    const tieneFicha = !!ficha;

    // Calcular edad si hay fecha de nacimiento en la ficha
    let edadDesdeFicha: number | null = null;
    if (ficha?.birthDate) {
        const hoy = new Date();
        const nacimiento = new Date(ficha.birthDate + 'T00:00:00');
        edadDesdeFicha = hoy.getFullYear() - nacimiento.getFullYear();
        const m = hoy.getMonth() - nacimiento.getMonth();
        if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
            edadDesdeFicha--;
        }
    }

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3">
                        <User className="h-6 w-6 text-blue-600"/>
                        Ficha de Identificación
                    </CardTitle>
                    {tieneFicha && (
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200" variant="outline">
                            <FileText className="mr-1 h-3 w-3" />
                            Completa
                        </Badge>
                    )}
                </div>
                <CardDescription>
                    Datos demográficos y de contacto del estudiante.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 p-6">
                
                {/* SECCIÓN I: DATOS GENERALES */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">I. Datos Generales del Estudiante</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <DataField icon={<User />} label="Nombre Completo" value={ficha?.fullName || student.name} />
                        {ficha?.birthDate ? (
                            <DataField
                                icon={<Calendar />}
                                label="Fecha de Nacimiento"
                                value={`${new Date(ficha.birthDate + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })} (${edadDesdeFicha} años)`}
                            />
                        ) : (
                            <DataField icon={<Shield />} label="Edad" value={`${student.demographics.age} años`} />
                        )}
                        {ficha?.sexo && (
                            <DataField icon={<Shield />} label="Sexo" value={ficha.sexo === 'femenino' ? 'Femenino' : 'Masculino'} />
                        )}
                        {ficha?.genderIdentity && (
                            <DataField icon={<User />} label="Identidad de Género" value={ficha.genderIdentity} />
                        )}
                        <DataField icon={<Home />} label="Grupo" value={ficha?.group || student.demographics.group} />
                        <DataField icon={<Home />} label="Semestre" value={ficha?.semester ? `${ficha.semester}°` : `${student.demographics.semester}°`} />
                    </div>
                </div>

                <Separator />

                {/* SECCIÓN II: DATOS DE CONTACTO */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">II. Datos de Contacto</h3>
                    {tieneFicha ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {ficha.domicilio && (
                                <DataField icon={<Home />} label="Domicilio" value={ficha.domicilio} />
                            )}
                            {ficha.celular && (
                                <DataField icon={<Phone />} label="Celular" value={ficha.celular} />
                            )}
                            {ficha.whatsapp && (
                                <DataField icon={<MessageCircle />} label="WhatsApp" value={ficha.whatsapp} />
                            )}
                            {ficha.email && (
                                <DataField icon={<Mail />} label="Correo Electrónico" value={ficha.email} />
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <DataField icon={<User />} label="Contacto de Emergencia" value={student.emergencyContact.name} />
                            <DataField icon={<Phone />} label="Teléfono de Emergencia" value={student.emergencyContact.phone} />
                        </div>
                    )}
                </div>

                {tieneFicha && (
                    <>
                        <Separator />

                        {/* SECCIÓN III: DATOS SOCIOFAMILIARES */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-700 mb-4">III. Datos Sociofamiliares</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {ficha!.livingWith && (
                                    <DataField icon={<Heart />} label="Vive con" value={livingWithLabels[ficha!.livingWith] || ficha!.livingWith} />
                                )}
                                {ficha!.motherName && (
                                    <DataField icon={<User />} label="Madre o Tutor(a)" value={`${ficha!.motherName}${ficha!.motherPhone ? ` — ${ficha!.motherPhone}` : ''}`} />
                                )}
                                {ficha!.fatherName && (
                                    <DataField icon={<User />} label="Padre o Tutor" value={`${ficha!.fatherName}${ficha!.fatherPhone ? ` — ${ficha!.fatherPhone}` : ''}`} />
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* Antecedentes */}
                {tieneFicha && ficha!.backgroundInfo && (
                    <>
                        <Separator />
                        <div>
                            <h3 className="text-lg font-semibold text-gray-700 mb-4">IV. Antecedentes Personales</h3>
                            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{ficha!.backgroundInfo}</p>
                            </div>
                        </div>
                    </>
                )}

                {/* Nota de trazabilidad (legacy de store.ts) */}
                {!tieneFicha && student.dualRelationshipNote && (
                    <>
                        <Separator />
                        <div>
                            <h3 className="text-lg font-semibold text-gray-700 mb-4">Trazabilidad de Relación Dual (Cap. 4.3)</h3>
                             <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-md">
                                <p className="text-sm text-yellow-800">{student.dualRelationshipNote}</p>
                            </div>
                        </div>
                    </>
                )}

            </CardContent>
        </Card>
    );
}
