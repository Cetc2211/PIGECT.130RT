'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { get, set, del, clear } from 'idb-keyval';
import type { Student, Group, OfficialGroup, PartialId, StudentObservation, SpecialNote, EvaluationCriteria, GradeDetail, Grades, RecoveryGrade, RecoveryGrades, MeritGrade, MeritGrades, AttendanceRecord, ParticipationRecord, Activity, ActivityRecord, CalculatedRisk, StudentWithRisk, CriteriaDetail, StudentStats, GroupedActivities, AppSettings, PartialData, AllPartialsData, AllPartialsDataForGroup, Announcement, StudentJustification, JustificationCategory } from '@/lib/placeholder-data';
import { DEFAULT_MODEL, normalizeModel } from '@/lib/ai-models';
import { useToast } from '@/hooks/use-toast';
import { getOfficialGroupStructures, saveOfficialGroupStructure } from '@/lib/storage-local';
import { hasLocalAccessProfile, getLocalSpecialistProfile } from '@/lib/local-access';

// TYPE DEFINITIONS
type ExportData = {
  version: string;
  groups: Group[];
  students: Student[];
  observations: { [studentId: string]: StudentObservation[] };
  specialNotes: SpecialNote[];
  settings: AppSettings;
  partialsData: AllPartialsData; 
};

export type UserProfile = {
    name: string;
    email: string;
    photoURL: string;
}

export const defaultSettings: AppSettings = {
    institutionName: "Mi Institución",
    logo: "",
    theme: "theme-candy",
    apiKey: "",
    signature: "",
    facilitatorName: "",
    scheduleImageUrl: "",
    teacherPhoto: "",
    whatsappContactNumber: "",
    aiModel: DEFAULT_MODEL,
};

const defaultPartialData: PartialData = {
    grades: {},
    attendance: {},
    participations: {},
    activities: [],
    activityRecords: {},
    recoveryGrades: {},
    feedbacks: {},
    groupAnalysis: '',
};

const normalizeSettingsValue = (settings: AppSettings): AppSettings => {
    const aiModel = normalizeModel(settings.aiModel);
    if (aiModel === settings.aiModel) {
        return settings;
    }
    return { ...settings, aiModel };
};

export type GroupRiskStats = {
    groupId: string;
    groupName: string;
    totalRisk: number;
    high: number;
    medium: number;
    studentsByRisk: {
        high: StudentWithRisk[];
        medium: StudentWithRisk[];
    };
};

// --- DATA CONTEXT & PROVIDER ---
interface DataContextType {
    // State
    isLoading: boolean;
    error: Error | null;
    groups: Group[];
    allStudents: Student[];
    activeStudentsInGroups: Student[];
    allObservations: { [studentId: string]: StudentObservation[] };
    specialNotes: SpecialNote[];
    settings: AppSettings;
    activeGroup: Group | null;
    activeGroupId: string | null;
    activePartialId: PartialId;
    partialData: PartialData;
    allPartialsDataForActiveGroup: AllPartialsDataForGroup;
    groupAverages: { [groupId: string]: number };
    atRiskStudents: StudentWithRisk[];
    groupRisks: { [groupId: string]: GroupRiskStats };
    overallAverageAttendance: number;
    officialGroups: OfficialGroup[];

    // State Setters
    setGroups: (setter: React.SetStateAction<Group[]>) => Promise<void>;
    setAllStudents: (setter: React.SetStateAction<Student[]>) => Promise<void>;
    setAllObservations: (setter: React.SetStateAction<{ [studentId: string]: StudentObservation[] }>) => Promise<void>;
    setAllPartialsData: (setter: React.SetStateAction<AllPartialsData>) => Promise<void>;
    setSpecialNotes: (setter: React.SetStateAction<SpecialNote[]>) => Promise<void>;
    setSettings: (settings: AppSettings) => Promise<void>;
    setActiveGroupId: (groupId: string | null) => void;
    setActivePartialId: (partialId: PartialId) => void;

    // Derived Setters for PartialData
    setGrades: (setter: React.SetStateAction<Grades>) => Promise<void>;
    setAttendance: (setter: React.SetStateAction<AttendanceRecord>) => Promise<void>;
    setParticipations: (setter: React.SetStateAction<ParticipationRecord>) => Promise<void>;
    setActivities: (setter: React.SetStateAction<Activity[]>) => Promise<void>;
    setActivityRecords: (setter: React.SetStateAction<ActivityRecord>) => Promise<void>;
    setRecoveryGrades: (setter: React.SetStateAction<RecoveryGrades>) => Promise<void>;
    setMeritGrades: (setter: React.SetStateAction<MeritGrades>) => Promise<void>;
    setStudentFeedback: (studentId: string, feedback: string) => Promise<void>;
    setGroupAnalysis: (analysis: string) => Promise<void>;

    // Core Actions
    addStudentsToGroup: (groupId: string, students: Student[]) => Promise<void>;
    removeStudentFromGroup: (groupId: string, studentId: string) => Promise<void>;
    updateGroup: (groupId: string, data: Partial<Omit<Group, 'id' | 'students'>>) => Promise<void>;
    updateStudent: (studentId: string, data: Partial<Student>) => Promise<void>;
    updateGroupCriteria: (criteria: EvaluationCriteria[]) => Promise<void>;
    deleteGroup: (groupId: string) => Promise<void>;
    addStudentObservation: (observation: Omit<StudentObservation, 'id' | 'date' | 'followUpUpdates' | 'isClosed'>) => Promise<void>;
    updateStudentObservation: (studentId: string, observationId: string, updateText: string, isClosing: boolean) => Promise<void>;
    takeAttendanceForDate: (groupId: string, date: string) => Promise<void>;
    deleteAttendanceDate: (date: string) => Promise<void>;
    resetAllData: () => Promise<void>;
    importAllData: (data: ExportData) => Promise<void>;
    addSpecialNote: (note: Omit<SpecialNote, 'id'>) => Promise<void>;
    updateSpecialNote: (noteId: string, note: Partial<Omit<SpecialNote, 'id'>>) => Promise<void>;
    deleteSpecialNote: (noteId: string) => Promise<void>;
    
    // Official Groups
    createOfficialGroup: (name: string, tutorEmail?: string) => Promise<string>;
    updateOfficialGroupTutor: (officialGroupId: string, tutorEmail: string) => Promise<void>;
    deleteOfficialGroup: (id: string) => Promise<void>;
    addStudentsToOfficialGroup: (officialGroupId: string, students: Student[]) => Promise<void>;
    getOfficialGroupStudents: (officialGroupId: string) => Promise<Student[]>;

    // Justifications & Announcements
    announcements: Announcement[];
    justifications: StudentJustification[];
    unreadAnnouncementsCount: number;
    markAnnouncementsAsRead: () => void;
    createAnnouncement: (title: string, message: string, targetGroup?: string, expiresAt?: string) => Promise<void>;
    createJustification: (studentId: string, date: string, reason: string, category: JustificationCategory) => Promise<void>;
    deleteAnnouncement: (id: string) => Promise<void>;
    deleteJustification: (id: string) => Promise<void>;

    // Calculation & Fetching
    calculateFinalGrade: (studentId: string) => number;
    calculateDetailedFinalGrade: (studentId: string, pData: PartialData, criteria: EvaluationCriteria[]) => { finalGrade: number; criteriaDetails: CriteriaDetail[]; isRecovery: boolean };
    getStudentRiskLevel: (finalGrade: number, pAttendance: AttendanceRecord, studentId: string) => CalculatedRisk;
    fetchPartialData: (groupId: string, partialId: PartialId) => Promise<(PartialData & { criteria: EvaluationCriteria[] }) | null>;
    triggerPedagogicalCheck: (studentId: string) => void;
    syncPublicData: () => Promise<void>;
    forceCloudSync: () => Promise<void>;
    uploadLocalToCloud: () => Promise<void>;
    syncStatus: 'synced';
    syncProgress: null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // --- STATE MANAGEMENT ---
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const [groups, setGroupsState] = useState<Group[]>([]);
    const [allStudents, setAllStudentsState] = useState<Student[]>([]);
    const [allObservations, setAllObservationsState] = useState<{ [studentId: string]: StudentObservation[] }>({});
    const [specialNotes, setSpecialNotesState] = useState<SpecialNote[]>([]);
    const [allPartialsData, setAllPartialsDataState] = useState<AllPartialsData>({});
    const [settings, setSettingsState] = useState(defaultSettings);
    const [officialGroups, setOfficialGroups] = useState<OfficialGroup[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [justifications, setJustifications] = useState<StudentJustification[]>([]);
    const [unreadAnnouncementsCount, setUnreadAnnouncementsCount] = useState(0); 

    useEffect(() => {
        const lastRead = localStorage.getItem('lastReadAnnouncementTime');
        const lastReadTime = lastRead ? new Date(lastRead).getTime() : 0;
        
        const unread = announcements.filter(a => new Date(a.createdAt).getTime() > lastReadTime).length;
        setUnreadAnnouncementsCount(unread);
    }, [announcements]);

    const markAnnouncementsAsRead = useCallback(() => {
        localStorage.setItem('lastReadAnnouncementTime', new Date().toISOString());
        setUnreadAnnouncementsCount(0);
    }, []);
    const [activeGroupId, setActiveGroupIdState] = useState<string | null>(null);
    const [activePartialId, setActivePartialIdState] = useState<PartialId>('p1');

    // Check local auth on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsAuthenticated(hasLocalAccessProfile());
        }
    }, []);

    // --- ASYNC DATA HYDRATION (100% LOCAL) ---
    useEffect(() => {
        const hydrateData = async () => {
            setIsLoading(true);
            try {
                // helper to load local
                const readLocal = async <T,>(key: string): Promise<{ value: T, lastUpdated: number } | undefined> => {
                     try {
                            const localPayload = await get(key);
                            if (localPayload && typeof localPayload === 'object' && 'value' in localPayload && 'lastUpdated' in localPayload) {
                                 return localPayload as { value: T, lastUpdated: number };
                            } else if (localPayload) {
                                 // Legacy format support
                                 return { value: localPayload as T, lastUpdated: 0 };
                            }
                     } catch (e) {
                         console.warn(`Error reading local data for ${key}`, e);
                     }
                     return undefined;
                };

                // Load Local Data in Parallel
                const [
                    localGroups,
                    localStudents,
                    localObservations,
                    localSpecialNotes,
                    localPartials,
                    localSettingsRaw,
                    localActiveGroupId
                ] = await Promise.all([
                    readLocal<Group[]>('app_groups'),
                    readLocal<Student[]>('app_students'),
                    readLocal<{ [studentId: string]: StudentObservation[] }>('app_observations'),
                    readLocal<SpecialNote[]>('app_specialNotes'),
                    readLocal<AllPartialsData>('app_partialsData'),
                    readLocal<AppSettings>('app_settings'),
                    get<string>('activeGroupId_v1')
                ]);

                // Apply Local Data
                if (localGroups) setGroupsState(localGroups.value);
                if (localStudents) setAllStudentsState(localStudents.value);
                if (localObservations) setAllObservationsState(localObservations.value);
                if (localSpecialNotes) setSpecialNotesState(localSpecialNotes.value);
                if (localPartials) setAllPartialsDataState(localPartials.value);
                
                const resolvedSettings = normalizeSettingsValue(localSettingsRaw?.value || defaultSettings);
                setSettingsState(resolvedSettings);

                const currentGroups = localGroups?.value || [];
                if (localActiveGroupId && currentGroups.some(g => g.id === localActiveGroupId)) {
                    setActiveGroupIdState(localActiveGroupId);
                } else if (currentGroups.length > 0) {
                    setActiveGroupIdState(currentGroups[0].id);
                } else {
                    setActiveGroupIdState(null);
                }

                setIsLoading(false);
            } catch (e) {
                console.error("Data hydration error:", e);
                setError(e instanceof Error ? e : new Error('An unknown error occurred during data hydration'));
                setIsLoading(false); 
            }
        };
        hydrateData();
    }, []);

    // Load official groups from local storage
    useEffect(() => {
        const localOfficialGroups = getOfficialGroupStructures();
        if (localOfficialGroups.length > 0) {
            setOfficialGroups(localOfficialGroups);
        }

        const cached = localStorage.getItem('cached_official_groups');
        if (cached) {
            try {
                const { data, timestamp } = JSON.parse(cached);
                // Cache valid for 5 minutes
                if (Date.now() - timestamp < 5 * 60 * 1000) {
                    if (Array.isArray(data)) {
                        const merged = [...localOfficialGroups];
                        for (const group of data as OfficialGroup[]) {
                            if (!merged.some((item) => item.id === group.id)) {
                                merged.push(group);
                            }
                        }
                        setOfficialGroups(merged);
                    }
                }
            } catch (e) {
                console.error("Error loading cached official groups:", e);
            }
        }
    }, []);

    // --- LOCAL STORAGE SETTER ---
    const createLocalSetter = <T,>(
        setter: React.Dispatch<React.SetStateAction<T>>,
        key: string,
        inMemoryState: T,
    ) => {
        return async (value: React.SetStateAction<T>) => {
            const newValue =
                typeof value === 'function'
                    ? (value as (prevState: T) => T)(inMemoryState)
                    : value;
            
            // Schema Validation Gatekeeper for groups
            if (key === 'app_groups') {
                const groups = newValue as Group[];
                const invalidGroups = groups.filter(g => 
                    !g.groupName || g.groupName.trim() === '' ||
                    !g.subject || g.subject.trim() === '' ||
                    !g.semester || g.semester.trim() === ''
                );
                if (invalidGroups.length > 0) {
                    console.warn('Schema validation failed for groups:', invalidGroups);
                    try {
                        const localPayload = await get(key);
                        if (localPayload && typeof localPayload === 'object' && 'value' in localPayload) {
                            const localGroups = localPayload.value as Group[];
                            const mergedGroups = [...groups];
                            localGroups.forEach(localGroup => {
                                if (!mergedGroups.some(g => g.id === localGroup.id)) {
                                    mergedGroups.push(localGroup);
                                }
                            });
                            setter(mergedGroups as T);
                            return;
                        }
                    } catch (e) {
                        console.error('Error consolidating local data:', e);
                    }
                    return;
                }
            }
            
            // 1. Update React State immediately
            setter(newValue);
            
            // 2. Save to IDB
            const now = Date.now();
            const payload = { value: newValue, lastUpdated: now };
            try {
                await set(key, payload);
            } catch (e) {
                console.error(`Error saving ${key} to IDB:`, e);
            }
        };
    };

    const setGroups = createLocalSetter(setGroupsState, 'app_groups', groups);
    const setAllStudents = createLocalSetter(setAllStudentsState, 'app_students', allStudents);
    const setAllObservations = createLocalSetter(setAllObservationsState, 'app_observations', allObservations);
    const setSpecialNotes = createLocalSetter(setSpecialNotesState, 'app_specialNotes', specialNotes);
    const setAllPartialsData = createLocalSetter(setAllPartialsDataState, 'app_partialsData', allPartialsData);
    
    // Explicit Settings Setter
    const setSettings = async (newSettings: AppSettings) => {
        const normalizedSettings = normalizeSettingsValue(newSettings);
        setSettingsState(normalizedSettings);
        
        const now = Date.now();
        const payload = { value: normalizedSettings, lastUpdated: now };

        try {
             await set('app_settings', payload);
        } catch(e) { console.error("Error saving local settings:", e); }
    };

    const setActiveGroupId = useCallback(async (groupId: string | null) => {
        setActiveGroupIdState(groupId);
        if (groupId) {
            await set('activeGroupId_v1', groupId);
        } else {
            await del('activeGroupId_v1');
        }
    }, []);
    
    // --- MEMOIZED DERIVED STATE ---
    const activeGroup = useMemo(() => {
      if (!activeGroupId) return null;
      return groups.find(g => g.id === activeGroupId) || null;
    }, [groups, activeGroupId]);

    const activeStudentsInGroups = useMemo(() => Array.from(new Map(groups.flatMap(g => g.students.map(s => [s.id, s]))).values()), [groups]);
    const allPartialsDataForActiveGroup = useMemo(() => allPartialsData[activeGroupId || ''] || {}, [allPartialsData, activeGroupId]);
    const partialData = useMemo(() => allPartialsDataForActiveGroup[activePartialId] || defaultPartialData, [allPartialsDataForActiveGroup, activePartialId]);

    // --- CORE FUNCTIONS / ACTIONS ---
    const setActivePartialId = (partialId: PartialId) => setActivePartialIdState(partialId);

    const createPartialDataSetter = useCallback((field: keyof PartialData) => {
        return async (setter: React.SetStateAction<any>) => {
            if (!activeGroupId) return;

            setAllPartialsData(prev => {
                const groupData = prev[activeGroupId] || {};
                const pData = groupData[activePartialId] || defaultPartialData;
                const oldValue = pData[field];
                const newValue = typeof setter === 'function' ? (setter as any)(oldValue) : setter;
                const updatedPData = { ...pData, [field]: newValue };
                const updatedGroupData = { ...groupData, [activePartialId]: updatedPData };
                
                const finalState = { ...prev, [activeGroupId]: updatedGroupData };
                set('app_partialsData', finalState); // Persist change
                return finalState;
            });
        };
    }, [activeGroupId, activePartialId, setAllPartialsData]);
    
    const setGrades = createPartialDataSetter('grades');
    
    // Custom setAttendance — local only
    const setAttendance = useCallback(async (setter: React.SetStateAction<AttendanceRecord>) => {
        if (!activeGroupId) return;

        await setAllPartialsData(prev => {
            const groupData = prev[activeGroupId] || {};
            const pData = groupData[activePartialId] || defaultPartialData;
            const oldValue = pData.attendance;
            const newValue = typeof setter === 'function' ? (setter as any)(oldValue) : setter;
            
            const updatedPData = { ...pData, attendance: newValue };
            const updatedGroupData = { ...groupData, [activePartialId]: updatedPData };
            const finalState = { ...prev, [activeGroupId]: updatedGroupData };
            set('app_partialsData', finalState);
            return finalState;
        });
    }, [activeGroupId, activePartialId, setAllPartialsData]);

    const setParticipations = createPartialDataSetter('participations');
    const setActivities = createPartialDataSetter('activities');
    const setActivityRecords = createPartialDataSetter('activityRecords');
    const setRecoveryGrades = createPartialDataSetter('recoveryGrades');
    const setMeritGrades = createPartialDataSetter('meritGrades');

    const setStudentFeedback = useCallback(async (studentId: string, feedback: string) => {
        if (!activeGroupId) return;
        setAllPartialsData(prev => {
            const groupData = prev[activeGroupId] || {};
            const pData = groupData[activePartialId] || defaultPartialData;
            const newFeedbacks = { ...(pData.feedbacks || {}), [studentId]: feedback };
            const finalState = { ...prev, [activeGroupId]: { ...groupData, [activePartialId]: { ...pData, feedbacks: newFeedbacks } } };
            set('app_partialsData', finalState);
            return finalState;
        });
    }, [activeGroupId, activePartialId, setAllPartialsData]);

    const setGroupAnalysis = useCallback(async (analysis: string) => {
        if (!activeGroupId) return;
        setAllPartialsData(prev => {
            const groupData = prev[activeGroupId] || {};
            const pData = groupData[activePartialId] || defaultPartialData;
            const finalState = { ...prev, [activeGroupId]: { ...groupData, [activePartialId]: { ...pData, groupAnalysis: analysis } } };
            set('app_partialsData', finalState);
            return finalState;
        });
    }, [activeGroupId, activePartialId, setAllPartialsData]);

    const addStudentsToGroup = useCallback(async (groupId: string, students: Student[]) => {
        console.log(`Adding ${students.length} students to group ${groupId}`);
        try {
            await setAllStudents(prev => [...prev, ...students.filter(s => !prev.some(ps => ps.id === s.id))]);
            await setGroups(prev => prev.map(g => g.id === groupId ? { ...g, students: [...g.students, ...students] } : g));
            console.log('Students added successfully');
        } catch (error) {
            console.error('Error in addStudentsToGroup:', error);
            throw error;
        }
    }, [setAllStudents, setGroups]);

    const removeStudentFromGroup = useCallback(async (groupId: string, studentId: string) => {
        await setGroups(prev => prev.map(g => g.id === groupId ? { ...g, students: g.students.filter(s => s.id !== studentId) } : g));
    }, [setGroups]);

    const updateGroup = useCallback(async (groupId: string, data: Partial<Omit<Group, 'id' | 'students'>>) => {
        await setGroups(prev => prev.map(g => g.id === groupId ? { ...g, ...data } : g));
    }, [setGroups]);

    const updateStudent = useCallback(async (studentId: string, data: Partial<Student>) => {
        await setAllStudents(prev => prev.map(s => (s.id === studentId ? { ...s, ...data } : s)));
        await setGroups(prev =>
            prev.map(g => ({
                ...g,
                students: g.students.map(s => (s.id === studentId ? { ...s, ...data } : s)),
            }))
        );
    }, [setAllStudents, setGroups]);

    const updateGroupCriteria = useCallback(async (criteria: EvaluationCriteria[]) => {
        if (!activeGroupId) return;
        await setGroups(prev => prev.map(g => g.id === activeGroupId ? { ...g, criteria } : g));
    }, [activeGroupId, setGroups]);

    const deleteGroup = useCallback(async (groupId: string) => {
        await setGroups(prev => prev.filter(g => g.id !== groupId));
        if (activeGroupId === groupId) setActiveGroupId(null);
    }, [activeGroupId, setGroups, setActiveGroupId]);

    const addStudentObservation = useCallback(async (obs: Omit<StudentObservation, 'id' | 'date' | 'followUpUpdates' | 'isClosed'>) => {
        const newObs = { ...obs, id: `OBS-${Date.now()}`, date: new Date().toISOString(), followUpUpdates: [], isClosed: false };
        await setAllObservations(prev => ({ ...prev, [obs.studentId]: [...(prev[obs.studentId] || []), newObs] }));
    }, [setAllObservations]);

    // Stub for pedagogical check (no cloud pedagogical_strategies collection)
    const triggerPedagogicalCheck = useCallback((_studentId: string) => {
        // No-op in local mode
    }, []);

    const updateStudentObservation = useCallback(async (studentId: string, obsId: string, updateText: string, isClosing: boolean) => {
        const updateData = { date: new Date().toISOString(), update: updateText };
        
        await setAllObservations(prev => ({
            ...prev,
            [studentId]: (prev[studentId] || []).map(obs => obs.id === obsId ? {
                ...obs,
                followUpUpdates: [...obs.followUpUpdates, updateData],
                isClosed: isClosing
            } : obs)
        }));
    }, [setAllObservations]);

    const takeAttendanceForDate = useCallback(async (groupId: string, date: string) => {
        const group = groups.find(g => g.id === groupId);
        if (!group) return;
        
        setAllPartialsData(prev => {
            const groupData = prev[groupId] || {};
            const pData = groupData[activePartialId] || defaultPartialData;
            if (pData.attendance[date]) return prev;
            const newAttendance = group.students.reduce((acc, s) => ({ ...acc, [s.id]: true }), {});
            const finalState = { ...prev, [groupId]: { ...groupData, [activePartialId]: { ...pData, attendance: { ...pData.attendance, [date]: newAttendance }, participations: { ...pData.participations, [date]: {} } } } };
            set('app_partialsData', finalState);
            return finalState;
        });
    }, [groups, activePartialId, setAllPartialsData]);

    const deleteAttendanceDate = useCallback(async (date: string) => {
        if (!activeGroupId) return;
        setAllPartialsData(prev => {
            const groupData = prev[activeGroupId] || {};
            const pData = groupData[activePartialId] || defaultPartialData;
            const { [date]: _, ...newAttendance } = pData.attendance;
            const { [date]: __, ...newParticipations } = pData.participations;
            const finalState = { ...prev, [activeGroupId]: { ...groupData, [activePartialId]: { ...pData, attendance: newAttendance, participations: newParticipations } } };
            set('app_partialsData', finalState);
            return finalState;
        });
    }, [activeGroupId, activePartialId, setAllPartialsData]);

    const resetAllData = useCallback(async () => {
       setIsLoading(true);
        try {
            await clear();
            setTimeout(() => window.location.reload(), 500);
        } catch (e) {
            setError(e as Error);
        }
    }, []);

    const importAllData = useCallback(async (data: ExportData) => {
        if (!data.version || !data.groups || !data.students || !data.settings) {
            throw new Error("Archivo de importación inválido o corrupto.");
        }
        await clear();

        await set('app_groups', { value: data.groups || [], lastUpdated: Date.now() });
        await set('app_students', { value: data.students || [], lastUpdated: Date.now() });
        await set('app_observations', { value: data.observations || {}, lastUpdated: Date.now() });
        await set('app_specialNotes', { value: data.specialNotes || [], lastUpdated: Date.now() });
        await set('app_settings', { value: data.settings, lastUpdated: Date.now() });
        await set('app_partialsData', { value: data.partialsData || {}, lastUpdated: Date.now() });
        
        if (data.groups && data.groups.length > 0) {
           await set('activeGroupId_v1', data.groups[0].id);
        }
    }, []);
    
    // Special Notes Actions
    const addSpecialNote = useCallback(async (note: Omit<SpecialNote, 'id'>) => {
        const newNote = { ...note, id: `NOTE-${Date.now()}` };
        await setSpecialNotes(prev => [...prev, newNote]);
    }, [setSpecialNotes]);

    const updateSpecialNote = useCallback(async (noteId: string, noteUpdate: Partial<Omit<SpecialNote, 'id'>>) => {
        await setSpecialNotes(prev => prev.map(n => n.id === noteId ? { ...n, ...noteUpdate } : n));
    }, [setSpecialNotes]);

    const deleteSpecialNote = useCallback(async (noteId: string) => {
        await setSpecialNotes(prev => prev.filter(n => n.id !== noteId));
    }, [setSpecialNotes]);

    // Official Groups Actions (LOCAL ONLY)
    const createOfficialGroup = useCallback(async (name: string, tutorEmail?: string) => {
        const groupPayload: OfficialGroup = {
            id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name,
            createdAt: new Date().toISOString(),
            tutorEmail: tutorEmail || '',
        };

        saveOfficialGroupStructure(groupPayload);
        setOfficialGroups((prev) => {
            if (prev.some((group) => group.id === groupPayload.id)) return prev;
            return [...prev, groupPayload];
        });

        // Update cache
        const cached = localStorage.getItem('cached_official_groups');
        let existingData: OfficialGroup[] = [];
        try {
            if (cached) existingData = JSON.parse(cached).data || [];
        } catch {}
        localStorage.setItem('cached_official_groups', JSON.stringify({
            data: [...existingData, groupPayload],
            timestamp: Date.now()
        }));

        return groupPayload.id;
    }, []);

    const updateOfficialGroupTutor = useCallback(async (officialGroupId: string, tutorEmail: string) => {
        // Update local official groups list
        setOfficialGroups(prev => prev.map(g => g.id === officialGroupId ? { ...g, tutorEmail } : g));
        saveOfficialGroupStructure({ id: officialGroupId, name: '', createdAt: '', tutorEmail });
    }, []);

    const deleteOfficialGroup = useCallback(async (id: string) => {
        setOfficialGroups(prev => prev.filter(g => g.id !== id));
    }, []);

    const addStudentsToOfficialGroup = useCallback(async (_officialGroupId: string, students: Student[]) => {
        // In local mode, just add students to local state
        await setAllStudents(prev => [...prev, ...students.filter(s => !prev.some(ps => ps.id === s.id))]);
    }, [setAllStudents]);

    const getOfficialGroupStudents = useCallback(async (_officialGroupId: string) => {
        // In local mode, return empty — students are managed via groups
        return [];
    }, []);

    // Announcements (LOCAL via localStorage)
    const ANNOUNCEMENTS_KEY = 'pigec_local_announcements';
    const JUSTIFICATIONS_KEY = 'pigec_local_justifications';

    const createAnnouncement = useCallback(async (title: string, message: string, targetGroup?: string, expiresAt?: string) => {
        const newAnn: Announcement = {
            id: `ann-${Date.now()}`,
            title,
            message,
            type: 'info',
            isActive: true,
            createdAt: new Date().toISOString(),
            ...(targetGroup ? { targetGroup } : {}),
            ...(expiresAt ? { expiresAt } : {}),
        } as Announcement;

        const existing: Announcement[] = (() => {
            try { return JSON.parse(localStorage.getItem(ANNOUNCEMENTS_KEY) || '[]'); } catch { return []; }
        })();
        existing.push(newAnn);
        localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(existing));
        setAnnouncements(existing);
    }, []);

    const deleteAnnouncement = useCallback(async (id: string) => {
        const existing: Announcement[] = (() => {
            try { return JSON.parse(localStorage.getItem(ANNOUNCEMENTS_KEY) || '[]'); } catch { return []; }
        })();
        const updated = existing.filter(a => a.id !== id);
        localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(updated));
        setAnnouncements(updated);
    }, []);

    const createJustification = useCallback(async (studentId: string, date: string, reason: string, category: JustificationCategory = 'Otro') => {
        const profile = getLocalSpecialistProfile();
        const newJust: StudentJustification = {
            id: `just-${Date.now()}`,
            studentId,
            date,
            reason,
            category,
            adminEmail: profile?.email || 'unknown',
            timestamp: new Date().toISOString(),
        };
        const existing: StudentJustification[] = (() => {
            try { return JSON.parse(localStorage.getItem(JUSTIFICATIONS_KEY) || '[]'); } catch { return []; }
        })();
        existing.push(newJust);
        localStorage.setItem(JUSTIFICATIONS_KEY, JSON.stringify(existing));
        setJustifications(existing);
    }, []);

    const deleteJustification = useCallback(async (id: string) => {
        const existing: StudentJustification[] = (() => {
            try { return JSON.parse(localStorage.getItem(JUSTIFICATIONS_KEY) || '[]'); } catch { return []; }
        })();
        const updated = existing.filter(j => j.id !== id);
        localStorage.setItem(JUSTIFICATIONS_KEY, JSON.stringify(updated));
        setJustifications(updated);
    }, []);

    // Load local announcements and justifications
    useEffect(() => {
        try {
            const anns = JSON.parse(localStorage.getItem(ANNOUNCEMENTS_KEY) || '[]') as Announcement[];
            // Filter expired
            const now = Date.now();
            const validAnns = anns.filter(a => {
                if (a.expiresAt && new Date(a.expiresAt).getTime() < now) return false;
                if (a.createdAt && !a.expiresAt) {
                    const createdTime = new Date(a.createdAt).getTime();
                    if (now - createdTime > 48 * 60 * 60 * 1000) return false;
                }
                return a.isActive !== false;
            });
            validAnns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setAnnouncements(validAnns);
        } catch {}
        try {
            const justs = JSON.parse(localStorage.getItem(JUSTIFICATIONS_KEY) || '[]') as StudentJustification[];
            setJustifications(justs);
        } catch {}
    }, []);

    // Stubs for cloud sync functions (local-only mode)
    const syncPublicData = useCallback(async () => {
        // No-op in local mode
    }, []);

    const forceCloudSync = useCallback(async () => {
        toast({ title: "Modo local", description: "No hay nube — todos los datos son locales." });
    }, [toast]);

    const uploadLocalToCloud = useCallback(async () => {
        toast({ title: "Modo local", description: "No hay nube — todos los datos son locales." });
    }, [toast]);

    // --- CALCULATIONS & DERIVED DATA ---
    const calculateDetailedFinalGrade = useCallback((studentId: string, pData: PartialData, criteria: EvaluationCriteria[]): { finalGrade: number, criteriaDetails: CriteriaDetail[], isRecovery: boolean } => {
        const meritInfo = pData.meritGrades?.[studentId];
        if (meritInfo?.applied) {
            return { finalGrade: meritInfo.grade ?? 0, criteriaDetails: [{ name: 'Asignación Directa', earned: meritInfo.grade ?? 0, weight: 100 }], isRecovery: false };
        }
        
        const recoveryInfo = pData.recoveryGrades?.[studentId];
        if (recoveryInfo?.applied) {
            return { finalGrade: recoveryInfo.grade ?? 0, criteriaDetails: [{ name: 'Recuperación', earned: recoveryInfo.grade ?? 0, weight: 100 }], isRecovery: true };
        }
        
        let totalEarned = 0;
        let totalPossibleWeight = 0;
        const criteriaDetails: CriteriaDetail[] = [];
        
        const activeCriteria = (criteria || []).filter(c => c.isActive !== false);

        if (!pData || activeCriteria.length === 0) return { finalGrade: 0, criteriaDetails: [], isRecovery: false };

        activeCriteria.forEach(c => {
            let ratio = 0;
            if (c.name === 'Actividades' || c.name === 'Portafolio') {
                const total = pData.activities?.length ?? 0;
                if (total > 0) {
                    const completed = Object.values(pData.activityRecords?.[studentId] || {}).filter(Boolean).length;
                    ratio = completed / total;
                }
            } else if (c.name === 'Participación') {
                const total = Object.keys(pData.participations || {}).length;
                if (total > 0) {
                    const daysAttended = Object.values(pData.participations).filter((day: any) => day[studentId]).length;
                    ratio = daysAttended / total;
                }
            } else {
                const delivered = pData.grades?.[studentId]?.[c.id]?.delivered ?? 0;
                if (c.expectedValue > 0) ratio = delivered / c.expectedValue;
            }
            
            const earned = ratio * c.weight;
            totalEarned += earned;
            totalPossibleWeight += c.weight;
            
            criteriaDetails.push({ name: c.name, earned, weight: c.weight });
        });

        let finalGrade = 0;
        if (totalPossibleWeight > 0) {
            finalGrade = (totalEarned / totalPossibleWeight) * 100;
        }

        return { finalGrade: Math.max(0, Math.min(100, finalGrade)), criteriaDetails, isRecovery: false };
    }, []);

    const calculateFinalGrade = useCallback((studentId: string) => {
        if (!activeGroup) return 0;
        const data = allPartialsData[activeGroup.id]?.[activePartialId];
        return calculateDetailedFinalGrade(studentId, data || defaultPartialData, activeGroup?.criteria || []).finalGrade;
    }, [activeGroup, activePartialId, allPartialsData, calculateDetailedFinalGrade]);

    const getStudentRiskLevel = useCallback((finalGrade: number, pAttendance: AttendanceRecord, studentId: string): CalculatedRisk => {
        const days = Object.keys(pAttendance).filter(d => Object.prototype.hasOwnProperty.call(pAttendance[d], studentId));
        const attended = days.reduce((count, d) => pAttendance[d][studentId] === true ? count + 1 : count, 0);
        const attendanceRate = days.length > 0 ? (attended / days.length) * 100 : 100;
        
        let reason = [];
        if (finalGrade <= 59) {
            reason.push(`Calificación reprobatoria (${finalGrade.toFixed(0)}%).`);
        }
        if (attendanceRate < 80) {
            reason.push(`Asistencia baja (${attendanceRate.toFixed(0)}%).`);
        }
        
        if (reason.length > 0) {
            return { level: 'high', reason: reason.join(' ') };
        }
        
        if (finalGrade > 59 && finalGrade <= 70) {
            return { level: 'medium', reason: `Calificación baja (${finalGrade.toFixed(0)}%).` };
        }
        
        return { level: 'low', reason: 'Rendimiento adecuado' };
    }, []);

    const groupAverages = useMemo(() => {
        return groups.reduce((acc, group) => {
            const data = allPartialsData[group.id]?.[activePartialId];
            if (!data || !group.criteria || group.criteria.length === 0) { acc[group.id] = 0; return acc; }
            const grades = group.students.map(s => calculateDetailedFinalGrade(s.id, data, group.criteria).finalGrade);
            acc[group.id] = grades.length > 0 ? grades.reduce((sum, g) => sum + g, 0) / grades.length : 0;
            return acc;
        }, {} as { [gid: string]: number });
    }, [groups, activePartialId, allPartialsData, calculateDetailedFinalGrade]);

    const atRiskStudents = useMemo(() => {
        return groups.flatMap(group => {
            const data = allPartialsData[group.id]?.[activePartialId];
            if (!data || !group.criteria || group.criteria.length === 0) return [];
            return group.students.map(student => {
                const finalGrade = calculateDetailedFinalGrade(student.id, data, group.criteria).finalGrade;
                const risk = getStudentRiskLevel(finalGrade, data.attendance, student.id);
                return { ...student, calculatedRisk: risk };
            }).filter(s => s.calculatedRisk.level !== 'low');
        }).filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
    }, [groups, activePartialId, allPartialsData, calculateDetailedFinalGrade, getStudentRiskLevel]);

    const groupRisks = useMemo(() => {
        const risks: { [groupId: string]: GroupRiskStats } = {};
        groups.forEach(group => {
            const data = allPartialsData[group.id]?.[activePartialId];
            if (!data || !group.criteria || group.criteria.length === 0) {
                 risks[group.id] = { groupId: group.id, groupName: group.subject, totalRisk: 0, high: 0, medium: 0, studentsByRisk: { high: [], medium: [] } };
                 return;
            }

            const high: StudentWithRisk[] = [];
            const medium: StudentWithRisk[] = [];

            group.students.forEach(student => {
                const finalGrade = calculateDetailedFinalGrade(student.id, data, group.criteria).finalGrade;
                const risk = getStudentRiskLevel(finalGrade, data.attendance, student.id);
                const sWithRisk = { ...student, calculatedRisk: risk };
                
                if (risk.level === 'high') high.push(sWithRisk);
                else if (risk.level === 'medium') medium.push(sWithRisk);
            });

            risks[group.id] = {
                groupId: group.id,
                groupName: group.subject,
                totalRisk: high.length + medium.length,
                high: high.length,
                medium: medium.length,
                studentsByRisk: { high, medium }
            };
        });
        return risks;
    }, [groups, activePartialId, allPartialsData, calculateDetailedFinalGrade, getStudentRiskLevel]);

    const overallAverageAttendance = useMemo(() => {
        if (!activeGroup) return 100;
        let totalPossible = 0;
        let totalPresent = 0;
        
        const attendanceForPartial = partialData.attendance;

        activeGroup.students.forEach(student => {
            Object.keys(attendanceForPartial).forEach(date => {
                if (Object.prototype.hasOwnProperty.call(attendanceForPartial[date], student.id)) {
                    totalPossible++;
                    if (attendanceForPartial[date][student.id]) {
                        totalPresent++;
                    }
                }
            });
        });

        if (totalPossible === 0) return 100;
        return (totalPresent / totalPossible) * 100;
    }, [activeGroup, partialData.attendance]);

    const fetchPartialData = useCallback(async (groupId: string, partialId: PartialId): Promise<(PartialData & { criteria: EvaluationCriteria[] }) | null> => {
        const group = groups.find(g => g.id === groupId);
        return group ? { ...(allPartialsData[groupId]?.[partialId] || defaultPartialData), criteria: group.criteria || [] } : null;
    }, [allPartialsData, groups]);

    return (
        <DataContext.Provider value={{
            isLoading, error, groups, allStudents, activeStudentsInGroups, allObservations, specialNotes, settings, activeGroup, activeGroupId, activePartialId, partialData, allPartialsDataForActiveGroup, groupAverages, atRiskStudents, groupRisks, overallAverageAttendance, officialGroups,
            announcements, justifications, unreadAnnouncementsCount, markAnnouncementsAsRead,
            setGroups, setAllStudents, setAllObservations, setAllPartialsData, setSpecialNotes,
            setSettings, setActiveGroupId, setActivePartialId,
            setGrades, setAttendance, setParticipations, setActivities, setActivityRecords, setRecoveryGrades, setMeritGrades, setStudentFeedback, setGroupAnalysis,
            addStudentsToGroup, removeStudentFromGroup, updateGroup, updateStudent, updateGroupCriteria, deleteGroup, addStudentObservation, updateStudentObservation, takeAttendanceForDate, deleteAttendanceDate, resetAllData, importAllData, addSpecialNote, updateSpecialNote, deleteSpecialNote,
            createOfficialGroup, updateOfficialGroupTutor, deleteOfficialGroup, addStudentsToOfficialGroup, getOfficialGroupStudents, createAnnouncement, deleteAnnouncement, createJustification, deleteJustification,
            calculateFinalGrade, calculateDetailedFinalGrade, getStudentRiskLevel, fetchPartialData, triggerPedagogicalCheck, syncPublicData, forceCloudSync, uploadLocalToCloud, syncStatus: 'synced', syncProgress: null,
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = (): DataContextType => {
    const context = useContext(DataContext);
    if (context === undefined) {
        if (typeof window === 'undefined') {
            const noopAsync = async (..._args: any[]) => {};
            const noopSync = (..._args: any[]) => {};

            return {
                isLoading: false,
                error: null,
                groups: [],
                allStudents: [],
                activeStudentsInGroups: [],
                allObservations: {},
                specialNotes: [],
                settings: defaultSettings,
                activeGroup: null,
                activeGroupId: null,
                activePartialId: 'p1',
                partialData: defaultPartialData,
                allPartialsDataForActiveGroup: {},
                groupAverages: {},
                atRiskStudents: [],
                groupRisks: {},
                overallAverageAttendance: 0,
                officialGroups: [],
                announcements: [],
                justifications: [],
                unreadAnnouncementsCount: 0,
                markAnnouncementsAsRead: noopSync,

                setGroups: noopAsync,
                setAllStudents: noopAsync,
                setAllObservations: noopAsync,
                setAllPartialsData: noopAsync,
                setSpecialNotes: noopAsync,
                setSettings: noopAsync,
                setActiveGroupId: noopSync,
                setActivePartialId: noopSync,
                setGrades: noopAsync,
                setAttendance: noopAsync,
                setParticipations: noopAsync,
                setActivities: noopAsync,
                setActivityRecords: noopAsync,
                setRecoveryGrades: noopAsync,
                setMeritGrades: noopAsync,
                setStudentFeedback: noopAsync,
                setGroupAnalysis: noopAsync,

                addStudentsToGroup: noopAsync,
                removeStudentFromGroup: noopAsync,
                updateGroup: noopAsync,
                updateStudent: noopAsync,
                updateGroupCriteria: noopAsync,
                deleteGroup: noopAsync,
                addStudentObservation: noopAsync,
                updateStudentObservation: noopAsync,
                takeAttendanceForDate: noopAsync,
                deleteAttendanceDate: noopAsync,
                resetAllData: noopAsync,
                importAllData: noopAsync,
                addSpecialNote: noopAsync,
                updateSpecialNote: noopAsync,
                deleteSpecialNote: noopAsync,

                createOfficialGroup: async () => '',
                updateOfficialGroupTutor: noopAsync,
                deleteOfficialGroup: noopAsync,
                addStudentsToOfficialGroup: noopAsync,
                getOfficialGroupStudents: async () => [],

                createAnnouncement: noopAsync,
                createJustification: noopAsync,
                deleteAnnouncement: noopAsync,
                deleteJustification: noopAsync,

                calculateFinalGrade: () => 0,
                calculateDetailedFinalGrade: () => ({ finalGrade: 0, criteriaDetails: [], isRecovery: false }),
                getStudentRiskLevel: () => ({ level: 'low', reason: 'Rendimiento adecuado' }),
                fetchPartialData: async () => null,
                triggerPedagogicalCheck: noopSync,
                syncPublicData: noopAsync,
                forceCloudSync: noopAsync,
                uploadLocalToCloud: noopAsync,
                syncStatus: 'synced',
                syncProgress: null,
            } as DataContextType;
        }

        throw new Error('useData debe ser usado dentro de un DataProvider');
    }
    return context;
};
