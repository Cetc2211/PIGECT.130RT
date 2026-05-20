import { Student, OfficialGroup, Group, StudentObservation } from '@/lib/placeholder-data';
import { getOfficialGroupStructures, saveOfficialGroupStructure } from '@/lib/storage-local';

// Definición extendida para incluir datos calculados para la vista del tutor
export interface TutorStudentView extends Student {
  totalAbsences: number;
  absencePercentage: number;
  riskVariables: {
    dropoutRisk: boolean;
    failingRisk: boolean;
    clinicalAlerts: string[];
  };
  recentLogs: StudentObservation[];
  aiSuggestion?: string;
  groupName: string;
  tutorInterventions: { id: string; date: string; action: string; }[];
}

const TUTOR_INTERVENTIONS_KEY = 'pigec_tutor_interventions';

function readLocalInterventions(): { id: string; studentId: string; action: string; date: string; }[] {
  try {
    return JSON.parse(localStorage.getItem(TUTOR_INTERVENTIONS_KEY) || '[]');
  } catch { return []; }
}

function writeLocalInterventions(interventions: { id: string; studentId: string; action: string; date: string; }[]) {
  localStorage.setItem(TUTOR_INTERVENTIONS_KEY, JSON.stringify(interventions));
}

export class TutorService {
    
  // 1. Filtro de Grupos Asignados (Local)
  static async getTutorGroupsForEmail(tutorEmail: string): Promise<OfficialGroup[]> {
    try {
        const allGroups = getOfficialGroupStructures();
        // Filter groups where the tutorEmail matches
        return allGroups.filter(g => g.tutorEmail?.toLowerCase() === tutorEmail.toLowerCase());
    } catch (error) {
        console.error("Error fetching tutor groups:", error);
        return [];
    }
  }

  // Helper para mantener compatibilidad
  static async getTutorGroup(tutorEmail: string): Promise<OfficialGroup | null> {
      const groups = await this.getTutorGroupsForEmail(tutorEmail);
      return groups.length > 0 ? groups[0] : null;
  }

  static async logTutorAction(studentId: string, action: string): Promise<{ id: string; date: string; action: string; }> {
      try {
          const newAction = {
              id: `tint-${Date.now()}`,
              studentId,
              action,
              date: new Date().toISOString(),
          };
          const all = readLocalInterventions();
          all.push(newAction);
          writeLocalInterventions(all);
          return newAction;
      } catch (e) {
          console.error("Error logging action:", e);
          throw e;
      }
  }

  // 2. Concentrador de Datos (Local)
  static async getStudentsWithAnalytics(officialGroupId: string): Promise<TutorStudentView[]> {
    try {
        // A. Get official group data
        const allGroups = getOfficialGroupStructures();
        const officialGroup = allGroups.find(g => g.id === officialGroupId);
        
        // B. Read students from localStorage-based groups
        const studentsFromGroupsStr = localStorage.getItem('pigec_estudiantes_grupo');
        let allGroupStudents: Student[] = [];
        if (studentsFromGroupsStr) {
          try {
            const parsed = JSON.parse(studentsFromGroupsStr);
            if (Array.isArray(parsed)) allGroupStudents = parsed;
            else if (typeof parsed === 'object') {
              // Object keyed by groupId
              allGroupStudents = Object.values(parsed).flat() as Student[];
            }
          } catch {}
        }
        
        // Also read from IDB-backed groups
        const groupsStr = localStorage.getItem('pigec_grupos');
        if (groupsStr) {
          try {
            const groups = JSON.parse(groupsStr) as Group[];
            for (const g of groups) {
              if (g.officialGroupId === officialGroupId || g.id === officialGroupId) {
                allGroupStudents.push(...g.students);
              }
            }
          } catch {}
        }

        // Deduplicate students by id
        const seen = new Set<string>();
        const baseStudents: Student[] = [];
        for (const s of allGroupStudents) {
          if (s.id && !seen.has(s.id)) {
            seen.add(s.id);
            baseStudents.push(s);
          }
        }

        if (baseStudents.length === 0) return [];

        // C. Read observations from localStorage
        const observationsStr = localStorage.getItem('pigec_clinical_assessments');
        const observationMap: { [id: string]: StudentObservation[] } = {};
        if (observationsStr) {
          try {
            const obs = JSON.parse(observationsStr) as StudentObservation[];
            for (const o of obs) {
              if (!observationMap[o.studentId]) observationMap[o.studentId] = [];
              observationMap[o.studentId].push(o);
            }
          } catch {}
        }

        // D. Read tutor interventions
        const interventions = readLocalInterventions();
        const interventionsMap: { [id: string]: any[] } = {};
        for (const i of interventions) {
          if (!interventionsMap[i.studentId]) interventionsMap[i.studentId] = [];
          interventionsMap[i.studentId].push(i);
        }

        return baseStudents.map(student => {
            const totalAbsences = 0; // Local mode — absences tracked per-group
            const absencePercentage = 0;
            const isDropoutRisk = false; // Requires cross-group data not available locally
            const isFailingRisk = false; // Requires compliance data not available locally
            
            // Clinical Alerts
            const clinicalAlerts: string[] = [];
            if (student.clinicalStatus === 'pendiente' || (student.neuropsiScore && student.neuropsiScore < 70)) {
                clinicalAlerts.push('Atención Clínica Requerida');
            }
            if (student.pedagogicalInstructions) {
                clinicalAlerts.push(student.pedagogicalInstructions);
            }

            // AI Suggestion
            let aiSuggestion = undefined;
            if (clinicalAlerts.length > 0) {
                 aiSuggestion = 'Acción recomendada: Canalizar a intervención clínica en PIGEC.';
            }

            return {
                ...student,
                totalAbsences,
                absencePercentage,
                riskVariables: {
                    dropoutRisk: isDropoutRisk,
                    failingRisk: isFailingRisk,
                    clinicalAlerts
                },
                recentLogs: observationMap[student.id] || [],
                aiSuggestion,
                groupName: officialGroup?.name || 'Oficial', 
                tutorInterventions: (interventionsMap[student.id] || []).slice(0, 10)
            };
        });

    } catch (error) {
        console.error("Error building tutor view:", error);
        return [];
    }
  }

  static async getAllObservations(studentIds: string[]): Promise<{[id: string]: StudentObservation[]}> {
      try {
          const observationsStr = localStorage.getItem('pigec_clinical_assessments');
          if (!observationsStr) return {};
          const obs = JSON.parse(observationsStr) as StudentObservation[];
          const map: {[id: string]: StudentObservation[]} = {};
          for (const o of obs) {
              if (studentIds.includes(o.studentId)) {
                  if (!map[o.studentId]) map[o.studentId] = [];
                  map[o.studentId].push(o);
              }
          }
          return map;
      } catch (e) {
          return {};
      }
  }

  static async getComplianceStats(officialGroupId: string, studentIds: string[]): Promise<{[id: string]: {completionRate: number, failingSubjects: number}}> {
      const stats: {[id: string]: {completionRate: number, failingSubjects: number}} = {};
      studentIds.forEach(id => stats[id] = { completionRate: 100, failingSubjects: 0 });
      return stats;
  }

  static async getTutorInterventions(studentIds: string[]): Promise<{[id: string]: any[]}> {
      const interventions = readLocalInterventions();
      const map: {[id: string]: any[]} = {};
      for (const i of interventions) {
          if (studentIds.includes(i.studentId)) {
              if (!map[i.studentId]) map[i.studentId] = [];
              map[i.studentId].push(i);
          }
      }
      return map;
  }
}
