'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from './ui/dialog';
import {
  TestTube2, Eye, Send, Copy, ExternalLink, Mail, MessageSquare,
  QrCode, Share2, CheckCircle2, Clock, AlertTriangle, RefreshCw,
  ClipboardList, Link2, Shield,
} from 'lucide-react';
import ScreeningInstrumentDialog from './ScreeningInstrumentDialog';
import { saveEvaluationSession } from '@/lib/storage-local';

// ============================================================================
// CATÁLOGO DE PRUEBAS CLÍNICAS PARA BANCO DE PRUEBAS
// Solo instrumentos del área clínica (exclusivos del expediente individual)
// ============================================================================

interface TestItem {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  risk?: 'high' | 'medium';
}

const clinicalTests: TestItem[] = [
  // Depresión
  { id: 'phq-9', title: 'PHQ-9', description: 'Tamizaje de depresión + alerta de ideación suicida (ítem 9)', category: 'Depresión', duration: '5 min', risk: 'medium' },
  { id: 'bdi-ii', title: 'BDI-II', description: 'Inventario de Depresión de Beck-II — Severidad de síntomas depresivos', category: 'Depresión', duration: '10 min' },

  // Ansiedad
  { id: 'gad-7', title: 'GAD-7', description: 'Escala de Ansiedad Generalizada-7 — Tamizaje de ansiedad', category: 'Ansiedad', duration: '5 min' },
  { id: 'bai', title: 'BAI', description: 'Inventario de Ansiedad de Beck — Ansiedad con 4 factores', category: 'Ansiedad', duration: '10 min' },
  { id: 'hads', title: 'HADS', description: 'Escala Hospitalaria de Ansiedad y Depresión', category: 'Ansiedad', duration: '5 min' },
  { id: 'idare', title: 'IDARE/STAI', description: 'Inventario de Ansiedad Estado-Rasgo', category: 'Ansiedad', duration: '15 min' },

  // Desesperanza y Pensamientos
  { id: 'bhs', title: 'BHS', description: 'Escala de Desesperanza de Beck', category: 'Desesperanza y Pensamientos', duration: '5 min' },
  { id: 'ipa', title: 'IPA', description: 'Inventario de Pensamientos Automáticos — Distorsiones cognitivas', category: 'Desesperanza y Pensamientos', duration: '15 min' },

  // Ideación y Conducta Suicida
  { id: 'ssi', title: 'SSI', description: '⚠️ Escala de Ideación Suicida de Beck — Evaluación detallada', category: 'Ideación y Conducta Suicida', duration: '15 min', risk: 'high' },
  { id: 'plutchik', title: 'Plutchik', description: '⚠️ Escala de Riesgo Suicida de Plutchik — Tamizaje', category: 'Ideación y Conducta Suicida', duration: '5 min', risk: 'high' },
  { id: 'columbia', title: 'Columbia C-SSRS', description: '⚠️ Categoría Severidad Suicida de Columbia', category: 'Ideación y Conducta Suicida', duration: '5 min', risk: 'high' },
  { id: 'cdfr', title: 'CDFR', description: 'Cuestionario de Factores de Riesgo', category: 'Ideación y Conducta Suicida', duration: '10 min', risk: 'high' },

  // Conductas de Riesgo
  { id: 'assist', title: 'ASSIST', description: 'Test de Detección de Consumo de Sustancias WHO', category: 'Conductas de Riesgo', duration: '10 min' },
];

const categoryOrder = [
  'Depresión',
  'Ansiedad',
  'Desesperanza y Pensamientos',
  'Ideación y Conducta Suicida',
  'Conductas de Riesgo',
];

const categoryColors: Record<string, string> = {
  'Depresión': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'Ansiedad': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  'Desesperanza y Pensamientos': 'bg-amber-100 text-amber-700 border-amber-200',
  'Ideación y Conducta Suicida': 'bg-red-100 text-red-700 border-red-200',
  'Conductas de Riesgo': 'bg-orange-100 text-orange-700 border-orange-200',
};

const categoryIcons: Record<string, string> = {
  'Depresión': '😞',
  'Ansiedad': '😰',
  'Desesperanza y Pensamientos': '💭',
  'Ideación y Conducta Suicida': '🚨',
  'Conductas de Riesgo': '⚠️',
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

interface BancoDePruebasProps {
  /** ID del estudiante/expediente (se incrusta en el enlace) */
  studentId: string;
  /** Nombre del estudiante (para el mensaje de invitación) */
  studentName: string;
  /** Grupo del estudiante */
  groupName?: string;
  /** Matricula del estudiante (opcional) */
  studentMatricula?: string;
}

interface IndividualSession {
  id: string;
  studentId: string;
  studentName: string;
  tests: string[];
  mode: 'individual';
  status: 'active' | 'completed' | 'expired';
  createdAt: Date;
  expiresAt: Date;
  link: string;
}

export default function BancoDePruebas({ studentId, studentName, groupName, studentMatricula }: BancoDePruebasProps) {
  // Estado de selección
  const [selectedTests, setSelectedTests] = useState<string[]>([]);

  // Estado de sesión
  const [sessionName, setSessionName] = useState('');
  const [expirationDays, setExpirationDays] = useState('7');
  const [generatedLink, setGeneratedLink] = useState('');
  const [currentSession, setCurrentSession] = useState<IndividualSession | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Pruebas organizadas por categoría
  const categorizedTests = useMemo(() => {
    return categoryOrder.map(category => ({
      name: category,
      tests: clinicalTests.filter(t => t.category === category),
      color: categoryColors[category] || 'bg-gray-100 text-gray-700',
      icon: categoryIcons[category] || '📋',
    })).filter(cat => cat.tests.length > 0);
  }, []);

  // Tiempo total estimado
  const totalTime = useMemo(() => {
    return selectedTests.reduce((acc, id) => {
      const test = clinicalTests.find(t => t.id === id);
      return acc + parseInt(test?.duration || '0');
    }, 0);
  }, [selectedTests]);

  // ─── HANDLERS ────────────────────────────────────────────────────────

  const toggleTest = (testId: string) => {
    setSelectedTests(prev =>
      prev.includes(testId) ? prev.filter(id => id !== testId) : [...prev, testId]
    );
  };

  const selectCategory = (category: string) => {
    const catTests = clinicalTests.filter(t => t.category === category).map(t => t.id);
    setSelectedTests(prev => {
      const allSelected = catTests.every(id => prev.includes(id));
      if (allSelected) return prev.filter(id => !catTests.includes(id));
      return [...new Set([...prev, ...catTests])] as string[];
    });
  };

  const selectAll = () => {
    const allIds = clinicalTests.map(t => t.id);
    const allSelected = allIds.every(id => selectedTests.includes(id));
    setSelectedTests(allSelected ? [] : allIds);
  };

  const handleCreateLink = async () => {
    if (selectedTests.length === 0) return;

    setCreateError(null);
    setIsCreating(true);

    const sessionId = `ind_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const baseUrl = window.location.origin;
    const testsParam = selectedTests.join(',');
    const testType = selectedTests[0] || 'bateria';
    const params = new URLSearchParams({
      mode: 'individual',
      studentId,
      studentName,
      matricula: studentMatricula || '',
      tests: testsParam,
      testType,
      sessionName: sessionName || `Pruebas individuales - ${studentName}`,
    });
    const link = `${baseUrl}/evaluacion/${sessionId}?${params.toString()}`;

    const sessionData: IndividualSession = {
      id: sessionId,
      studentId,
      studentName,
      tests: selectedTests,
      mode: 'individual',
      status: 'active',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + parseInt(expirationDays) * 24 * 60 * 60 * 1000),
      link,
    };

    saveEvaluationSession({
      ...sessionData,
      name: sessionName || `Pruebas individuales — ${studentName}`,
      expedienteId: studentId,
      active: true,
      allowAnonymous: true,
      groups: [],
      completedCount: 0,
      totalCount: 1,
      createdAt: sessionData.createdAt.toISOString(),
      expiresAt: sessionData.expiresAt.toISOString(),
    });

    setGeneratedLink(link);
    setCurrentSession(sessionData);
    setIsCreating(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const getWhatsAppMessage = () => {
    if (!currentSession || !generatedLink) return '';
    const testNames = selectedTests.map(id => clinicalTests.find(t => t.id === id)?.title || id).join(', ');
    return `Estimado(a) ${studentName},

Se le invita a completar la(s) siguiente(s) prueba(s) psicométrica(s):

📋 ${testNames}
⏱️ Tiempo estimado: ${totalTime} minutos
📅 Disponible hasta: ${currentSession.expiresAt.toLocaleDateString('es-MX')}

🔗 Enlace: ${generatedLink}

IMPORTANTE: Este enlace es personal e intransferible. Al hacer clic, se redireccionará directamente a las pruebas.

Departamento de Orientación - CBTa 130`;
  };

  const shareViaWhatsApp = () => {
    const text = getWhatsAppMessage();
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Evaluación Psicométrica — ${studentName}`);
    const body = encodeURIComponent(getWhatsAppMessage());
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const resetLink = () => {
    setSelectedTests([]);
    setSessionName('');
    setGeneratedLink('');
    setCurrentSession(null);
    setLinkCopied(false);
  };

  // ─── RENDER ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Banner informativo */}
      <Alert className="border-blue-200 bg-blue-50">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertTitle>Banco de Pruebas — {studentName}</AlertTitle>
        <AlertDescription className="text-blue-700">
          Las pruebas que se apliquen desde este expediente son exclusivas de {studentName}.
          Los resultados se integrarán automáticamente al Resumen Ejecutivo de este expediente.
        </AlertDescription>
      </Alert>

      {createError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error al generar enlace</AlertTitle>
          <AlertDescription>{createError}</AlertDescription>
        </Alert>
      )}

      {/* Resumen de selección */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4 flex items-center gap-3">
            <TestTube2 className="h-6 w-6 text-purple-600" />
            <div>
              <p className="text-xl font-bold text-purple-700">{clinicalTests.length}</p>
              <p className="text-xs text-purple-600">Pruebas disponibles</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 flex items-center gap-3">
            <ClipboardList className="h-6 w-6 text-blue-600" />
            <div>
              <p className="text-xl font-bold text-blue-700">{selectedTests.length}</p>
              <p className="text-xs text-blue-600">Seleccionadas</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-6 w-6 text-amber-600" />
            <div>
              <p className="text-xl font-bold text-amber-700">{totalTime}</p>
              <p className="text-xs text-amber-600">Min. estimados</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <div>
              <p className="text-xl font-bold text-red-700">
                {selectedTests.filter(id => clinicalTests.find(t => t.id === id)?.risk === 'high').length}
              </p>
              <p className="text-xs text-red-600">Pruebas críticas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generar enlace (si no hay link generado) */}
      {!generatedLink && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Seleccionar Pruebas
            </CardTitle>
            <CardDescription>
              Elija los instrumentos que aplicará a {studentName}. Puede seleccionar varias pruebas a la vez.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filtros rápidos */}
            <div className="flex flex-wrap gap-2 mb-6">
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-blue-100"
                onClick={selectAll}
              >
                {selectedTests.length === clinicalTests.length ? '✓' : '+'} Todas
              </Badge>
              {categorizedTests.map(cat => {
                const allCatSelected = cat.tests.every(t => selectedTests.includes(t.id));
                return (
                  <Badge
                    key={cat.name}
                    variant={allCatSelected ? 'default' : 'outline'}
                    className={`cursor-pointer ${allCatSelected ? cat.color : 'hover:bg-gray-100'}`}
                    onClick={() => selectCategory(cat.name)}
                  >
                    {allCatSelected ? '✓' : '+'} {cat.icon} {cat.name}
                  </Badge>
                );
              })}
            </div>

            {/* Catálogo por categoría */}
            <div className="space-y-8">
              {categorizedTests.map(category => (
                <div key={category.name}>
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                    <span className="text-lg">{category.icon}</span>
                    <h3 className="text-base font-semibold text-gray-700">{category.name}</h3>
                    <span className="text-xs text-gray-400">
                      ({category.tests.filter(t => selectedTests.includes(t.id)).length}/{category.tests.length} seleccionadas)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {category.tests.map(test => (
                      <Dialog key={test.id}>
                        <div
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            selectedTests.includes(test.id)
                              ? 'border-blue-500 bg-blue-50 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                          onClick={() => toggleTest(test.id)}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={selectedTests.includes(test.id)}
                              onCheckedChange={() => toggleTest(test.id)}
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">{test.title}</span>
                                {test.risk === 'high' && (
                                  <Badge variant="destructive" className="text-[10px] px-1.5">Crítico</Badge>
                                )}
                                {test.risk === 'medium' && (
                                  <Badge variant="secondary" className="text-[10px] px-1.5 bg-amber-100 text-amber-700">Atención</Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 leading-relaxed">{test.description}</p>
                              <p className="text-xs text-gray-400 mt-1">⏱ {test.duration}</p>
                            </div>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => e.stopPropagation()}
                                title="Vista previa del instrumento"
                              >
                                <Eye className="h-4 w-4 text-gray-400" />
                              </Button>
                            </DialogTrigger>
                          </div>
                        </div>
                        <ScreeningInstrumentDialog
                          instrumentId={test.id}
                          instrumentTitle={test.title}
                          studentId={studentId}
                        />
                      </Dialog>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Configuración y botón generar */}
            <div className="mt-8 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-gray-50">
                <div className="space-y-2">
                  <Label htmlFor="ind-session-name">Nombre de la sesión (opcional)</Label>
                  <Input
                    id="ind-session-name"
                    placeholder={`Ej: Evaluación individual — ${studentName}`}
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vigencia del enlace</Label>
                  <Select value={expirationDays} onValueChange={setExpirationDays}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 día</SelectItem>
                      <SelectItem value="3">3 días</SelectItem>
                      <SelectItem value="7">7 días</SelectItem>
                      <SelectItem value="14">14 días</SelectItem>
                      <SelectItem value="30">30 días</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleCreateLink}
                disabled={selectedTests.length === 0 || isCreating}
                className="w-full"
                size="lg"
              >
                {isCreating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generando enlace...
                  </>
                ) : (
                  <>
                    <Link2 className="mr-2 h-5 w-5" />
                    Generar Enlace Individual ({selectedTests.length} prueba{selectedTests.length !== 1 ? 's' : ''})
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enlace generado */}
      {generatedLink && currentSession && (
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              Enlace Generado Exitosamente
            </CardTitle>
            <CardDescription>
              Envía este enlace a {studentName}. Al hacer clic, se redirigirá directamente a las pruebas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Link */}
            <div className="flex items-center gap-2">
              <Input
                value={generatedLink}
                readOnly
                className="bg-white font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(generatedLink)}
              >
                {linkCopied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => window.open(generatedLink, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>

            {/* Opciones de compartir */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button
                variant="outline"
                className="flex flex-col items-center gap-2 h-auto py-4"
                onClick={shareViaWhatsApp}
              >
                <MessageSquare className="h-6 w-6 text-green-600" />
                <span className="text-xs">WhatsApp</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center gap-2 h-auto py-4"
                onClick={shareViaEmail}
              >
                <Mail className="h-6 w-6 text-blue-600" />
                <span className="text-xs">Correo</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center gap-2 h-auto py-4 opacity-50 cursor-not-allowed"
              >
                <QrCode className="h-6 w-6 text-gray-600" />
                <span className="text-xs">Código QR</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center gap-2 h-auto py-4 opacity-50 cursor-not-allowed"
              >
                <Share2 className="h-6 w-6 text-purple-600" />
                <span className="text-xs">Compartir</span>
              </Button>
            </div>

            {/* Resumen */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Estudiante</p>
                  <p className="font-semibold">{studentName}</p>
                </div>
                <div>
                  <p className="text-gray-500">Pruebas</p>
                  <p className="font-semibold">{selectedTests.length}</p>
                </div>
                <div>
                  <p className="text-gray-500">Tiempo estimado</p>
                  <p className="font-semibold">{totalTime} min</p>
                </div>
                <div>
                  <p className="text-gray-500">Expira</p>
                  <p className="font-semibold">{currentSession.expiresAt.toLocaleDateString('es-MX')}</p>
                </div>
              </div>
            </div>

            {/* Mensaje sugerido */}
            <div className="p-4 border rounded-lg bg-gray-50">
              <p className="font-semibold mb-2 text-sm">💬 Mensaje sugerido:</p>
              <div className="bg-white p-3 rounded border text-xs whitespace-pre-wrap max-h-40 overflow-y-auto font-mono">
                {getWhatsAppMessage()}
              </div>
              <Button
                variant="outline"
                className="mt-2"
                size="sm"
                onClick={() => copyToClipboard(getWhatsAppMessage())}
              >
                <Copy className="mr-2 h-3 w-3" />
                Copiar mensaje
              </Button>
            </div>

            {/* Reset */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={resetLink}>
                <Send className="mr-2 h-4 w-4" />
                Generar otro enlace
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
