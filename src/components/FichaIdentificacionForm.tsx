'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "./ui/textarea";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { CheckCircle2 } from 'lucide-react';
import {
  FichaIdentificacionData,
  defaultFichaIdentificacion,
} from "@/lib/expediente-service";

/**
 * Props del formulario de Ficha de Identificación.
 *
 * Modo 1 — Solo lectura / Preview (sin props):
 *   El formulario es NO controlado. Se usa en ScreeningInstrumentDialog.
 *
 * Modo 2 — Controlado (con props):
 *   Se usa al crear un nuevo expediente individual.
 *   Recibe `values`, `onChange` y opcionalmente `errors`.
 */
interface FichaIdentificacionFormProps {
  /** Datos controlados del formulario (modo creación) */
  values?: FichaIdentificacionData;
  /** Callback cuando cambian los datos (modo creación) */
  onChange?: (data: FichaIdentificacionData) => void;
  /** Errores de validación campo → mensaje */
  errors?: Partial<Record<keyof FichaIdentificacionData, string>>;
  /** Deshabilitar todos los campos */
  disabled?: boolean;
  /** Callback al finalizar (modo evaluación — avanza a la siguiente prueba) */
  onComplete?: (result: any) => void;
  /** ID del estudiante (modo evaluación) */
  studentId?: string;
  /** ID del grupo (modo evaluación) */
  grupoId?: string;
  /** Matrícula (modo evaluación) */
  matricula?: string;
}

/** Helper: actualiza un campo del objeto FichaIdentificacionData */
function updateField(
  prev: FichaIdentificacionData,
  field: keyof FichaIdentificacionData,
  value: string
): FichaIdentificacionData {
  return { ...prev, [field]: value };
}

export default function FichaIdentificacionForm({
  values,
  onChange,
  errors,
  disabled,
  onComplete,
}: FichaIdentificacionFormProps) {
  const isControlled = !!values && !!onChange;
  const isEvaluationMode = !!onComplete && !isControlled;

  // Estado local para modo evaluación (no controlado con botón Finalizar)
  const [localData, setLocalData] = useState<FichaIdentificacionData>({ ...defaultFichaIdentificacion });

  // En modo no controlado para evaluación, usar estado local
  const v = isControlled ? values : isEvaluationMode ? localData : values;

  const handleChange = (field: keyof FichaIdentificacionData, value: string) => {
    if (isControlled && onChange) {
      onChange(updateField(v!, field, value));
    } else if (isEvaluationMode) {
      setLocalData(prev => updateField(prev, field, value));
    }
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete(isEvaluationMode ? localData : v);
    }
  };

  const getFieldClass = (field: keyof FichaIdentificacionData) => {
    if (errors?.[field]) return "border-red-500 focus-visible:ring-red-500";
    return "";
  };

  const renderError = (field: keyof FichaIdentificacionData) => {
    if (!errors?.[field]) return null;
    return <p className="text-xs text-red-500 mt-1">{errors[field]}</p>;
  };

  return (
    <>
    <form className="space-y-8 p-1" onSubmit={(e) => e.preventDefault()}>
      {/* SECCIÓN I: DATOS DEL ESTUDIANTE */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="flex items-center justify-center h-7 w-7 rounded-full bg-blue-100 text-blue-700 text-sm font-bold">I</span>
          <h3 className="text-lg font-semibold text-gray-700">Datos del Estudiante</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="full-name">
              Nombre Completo <span className="text-red-500">*</span>
            </Label>
            <Input
              id="full-name"
              name="full-name"
              placeholder="Ej. Ana María Pérez López"
              value={isControlled ? v!.fullName : undefined}
              defaultValue={!isControlled ? undefined : undefined}
              onChange={(e) => handleChange("fullName", e.target.value)}
              disabled={disabled}
              className={getFieldClass("fullName")}
            />
            {renderError("fullName")}
          </div>
          <div className="space-y-2">
            <Label htmlFor="birth-date">
              Fecha de Nacimiento <span className="text-red-500">*</span>
            </Label>
            <Input
              id="birth-date"
              name="birth-date"
              type="date"
              value={isControlled ? v!.birthDate : undefined}
              onChange={(e) => handleChange("birthDate", e.target.value)}
              disabled={disabled}
              className={getFieldClass("birthDate")}
            />
            {renderError("birthDate")}
          </div>
          <div className="space-y-2">
            <Label>
              Sexo <span className="text-red-500">*</span>
            </Label>
            <RadioGroup
              name="sexo"
              className="flex gap-4"
              value={isControlled ? v!.sexo : undefined}
              onValueChange={(val) => handleChange("sexo", val)}
              disabled={disabled}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="femenino" id="sex-fem" />
                <Label htmlFor="sex-fem" className="font-normal">Femenino</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="masculino" id="sex-masc" />
                <Label htmlFor="sex-masc" className="font-normal">Masculino</Label>
              </div>
            </RadioGroup>
            {renderError("sexo")}
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender-identity">Identidad de Género</Label>
            <Input
              id="gender-identity"
              name="gender-identity"
              placeholder="Ej. Mujer, Hombre, No-binario..."
              value={isControlled ? v!.genderIdentity : undefined}
              onChange={(e) => handleChange("genderIdentity", e.target.value)}
              disabled={disabled}
              className={getFieldClass("genderIdentity")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="group">
              Grupo <span className="text-red-500">*</span>
            </Label>
            <Input
              id="group"
              name="group"
              placeholder="Ej. 5B"
              value={isControlled ? v!.group : undefined}
              onChange={(e) => handleChange("group", e.target.value)}
              disabled={disabled}
              className={getFieldClass("group")}
            />
            {renderError("group")}
          </div>
          <div className="space-y-2">
            <Label htmlFor="semester">
              Semestre <span className="text-red-500">*</span>
            </Label>
            <Input
              id="semester"
              name="semester"
              type="number"
              placeholder="Ej. 5"
              value={isControlled ? v!.semester : undefined}
              onChange={(e) => handleChange("semester", e.target.value)}
              disabled={disabled}
              className={getFieldClass("semester")}
            />
            {renderError("semester")}
          </div>
        </div>
      </div>

      <Separator />

      {/* SECCIÓN II: DATOS DE CONTACTO */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="flex items-center justify-center h-7 w-7 rounded-full bg-blue-100 text-blue-700 text-sm font-bold">II</span>
          <h3 className="text-lg font-semibold text-gray-700">Datos de Contacto del Estudiante</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="domicilio">Domicilio</Label>
            <Textarea
              id="domicilio"
              name="domicilio"
              placeholder="Calle, Número, Colonia, Municipio, Estado, C.P."
              value={isControlled ? v!.domicilio : undefined}
              onChange={(e) => handleChange("domicilio", e.target.value)}
              disabled={disabled}
              className={getFieldClass("domicilio")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="celular">Número Celular <span className="text-red-500">*</span></Label>
            <Input
              id="celular"
              name="celular"
              type="tel"
              placeholder="Ej. 55-1234-5678"
              value={isControlled ? v!.celular : undefined}
              onChange={(e) => handleChange("celular", e.target.value)}
              disabled={disabled}
              className={getFieldClass("celular")}
            />
            {renderError("celular")}
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp (si es diferente)</Label>
            <Input
              id="whatsapp"
              name="whatsapp"
              type="tel"
              placeholder="Ej. 55-8765-4321"
              value={isControlled ? v!.whatsapp : undefined}
              onChange={(e) => handleChange("whatsapp", e.target.value)}
              disabled={disabled}
              className={getFieldClass("whatsapp")}
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="ejemplo@correo.com"
              value={isControlled ? v!.email : undefined}
              onChange={(e) => handleChange("email", e.target.value)}
              disabled={disabled}
              className={getFieldClass("email")}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* SECCIÓN III: DATOS SOCIOFAMILIARES */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="flex items-center justify-center h-7 w-7 rounded-full bg-blue-100 text-blue-700 text-sm font-bold">III</span>
          <h3 className="text-lg font-semibold text-gray-700">Datos Sociofamiliares</h3>
        </div>
        <div className="space-y-6">
          <div className="space-y-4">
            <Label>¿Con quién vives actualmente? <span className="text-red-500">*</span></Label>
            <RadioGroup
              name="living-with"
              className="flex flex-wrap gap-4"
              value={isControlled ? v!.livingWith : undefined}
              onValueChange={(val) => handleChange("livingWith", val)}
              disabled={disabled}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ambos" id="lw-1" />
                <Label htmlFor="lw-1" className="font-normal">Ambos Padres</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mama" id="lw-2" />
                <Label htmlFor="lw-2" className="font-normal">Solo Mamá</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="papa" id="lw-3" />
                <Label htmlFor="lw-3" className="font-normal">Solo Papá</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="abuelos" id="lw-4" />
                <Label htmlFor="lw-4" className="font-normal">Abuelos</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="otro" id="lw-5" />
                <Label htmlFor="lw-5" className="font-normal">Otro</Label>
              </div>
            </RadioGroup>
            {renderError("livingWith")}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="mother-name">Nombre de la Madre o Tutor(a) <span className="text-red-500">*</span></Label>
              <Input
                id="mother-name"
                name="mother-name"
                placeholder="Nombre completo"
                value={isControlled ? v!.motherName : undefined}
                onChange={(e) => handleChange("motherName", e.target.value)}
                disabled={disabled}
                className={getFieldClass("motherName")}
              />
              {renderError("motherName")}
            </div>
            <div className="space-y-2">
              <Label htmlFor="mother-phone">Teléfono de la Madre o Tutor(a) <span className="text-red-500">*</span></Label>
              <Input
                id="mother-phone"
                name="mother-phone"
                type="tel"
                placeholder="Ej. 55-1111-2222"
                value={isControlled ? v!.motherPhone : undefined}
                onChange={(e) => handleChange("motherPhone", e.target.value)}
                disabled={disabled}
                className={getFieldClass("motherPhone")}
              />
              {renderError("motherPhone")}
            </div>
            <div className="space-y-2">
              <Label htmlFor="father-name">Nombre del Padre o Tutor</Label>
              <Input
                id="father-name"
                name="father-name"
                placeholder="Nombre completo"
                value={isControlled ? v!.fatherName : undefined}
                onChange={(e) => handleChange("fatherName", e.target.value)}
                disabled={disabled}
                className={getFieldClass("fatherName")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="father-phone">Teléfono del Padre o Tutor</Label>
              <Input
                id="father-phone"
                name="father-phone"
                type="tel"
                placeholder="Ej. 55-3333-4444"
                value={isControlled ? v!.fatherPhone : undefined}
                onChange={(e) => handleChange("fatherPhone", e.target.value)}
                disabled={disabled}
                className={getFieldClass("fatherPhone")}
              />
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* SECCIÓN IV: ANTECEDENTES */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="flex items-center justify-center h-7 w-7 rounded-full bg-blue-100 text-blue-700 text-sm font-bold">IV</span>
          <h3 className="text-lg font-semibold text-gray-700">Antecedentes Personales Relevantes</h3>
        </div>
        <div className="space-y-2">
          <Label htmlFor="background-info">
            Describe brevemente si has recibido atención psicológica o psiquiátrica previa, o si hay alguna condición médica relevante.
          </Label>
          <Textarea
            id="background-info"
            name="background-info"
            placeholder="Ej. 'Asistí a terapia por ansiedad hace 2 años', 'Tengo diagnóstico de TDAH', 'Sufro de migrañas frecuentes'..."
            value={isControlled ? v!.backgroundInfo : undefined}
            onChange={(e) => handleChange("backgroundInfo", e.target.value)}
            disabled={disabled}
            className={getFieldClass("backgroundInfo")}
          />
        </div>
      </div>
    </form>
    {/* Botón Finalizar — solo visible en modo evaluación */}
    {isEvaluationMode && (
      <div className="mt-6 pt-4 border-t flex justify-end">
        <Button onClick={handleComplete} className="gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Finalizar Ficha de Identificación
        </Button>
      </div>
    )}
    </>
  );
}
