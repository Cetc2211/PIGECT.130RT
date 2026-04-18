import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route temporal para publicar las reglas de Firestore.
 * 
 * Se usa UNA VEZ para configurar el proyecto y luego se elimina.
 * 
 * Endpoint: POST /api/deploy-rules
 * Body: { rules: string } o vacío (usa reglas por defecto)
 * 
 * IMPORTANTE: Esta ruta DEBE eliminarse después de publicar las reglas.
 */

const DEFAULT_RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ── FLUJO DE EVALUACIÓN (crítico) ──────────────────────────────
    match /evaluation_sessions/{sessionId} {
      allow read, write: if true;
    }

    match /test_results/{resultId} {
      allow read, write: if true;
    }

    match /expedientes/{expedienteId} {
      allow read, write: if true;
    }

    // ── DATOS DE LA APLICACIÓN ────────────────────────────────────
    match /official_groups/{groupId} {
      allow read, write: if true;
    }

    match /students/{studentId} {
      allow read, write: if true;
      match /clinical_records/{recordId} {
        allow read, write: if true;
      }
    }

    match /groups/{groupId} {
      allow read, write: if true;
    }

    match /matriculas_estudiantes/{matriculaId} {
      allow read, write: if true;
    }

    match /announcements/{announcementId} {
      allow read, write: if true;
    }

    match /justifications/{justificationId} {
      allow read, write: if true;
    }

    match /pedagogical_strategies/{strategyId} {
      allow read, write: if true;
    }

    match /observations/{observationId} {
      allow read, write: if true;
    }

    match /absences/{absenceId} {
      allow read, write: if true;
    }

    match /tracking_logs/{logId} {
      allow read, write: if true;
    }

    match /academic_compliance/{complianceId} {
      allow read, write: if true;
    }

    match /tutor_interventions/{interventionId} {
      allow read, write: if true;
    }

    match /admins/{adminId} {
      allow read, write: if true;
    }

    match /app_config/{configId} {
      allow read, write: if true;
    }

    match /pigec_identities/{identityId} {
      allow read, write: if true;
    }

    match /alumnos/{alumnoId} {
      allow read, write: if true;
    }

    match /configuracion_pruebas/{testConfigId} {
      allow read, write: if true;
    }

    match /users/{uid}/userData/{key} {
      allow read, write: if true;
    }

    match /_health_check/{checkId} {
      allow read, write: if true;
    }
  }
}`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rules = body.rules || DEFAULT_RULES;

    // Usar la Firebase REST API para obtener el token de la app actual
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'academic-tracker-qeoxi';

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'No se encontró NEXT_PUBLIC_FIREBASE_API_KEY en las variables de entorno.',
        hint: 'Agrega NEXT_PUBLIC_FIREBASE_API_KEY en Vercel → Settings → Environment Variables.'
      }, { status: 500 });
    }

    // Obtener un token anónimo para autenticar la petición de Firestore
    const authResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnSecureToken: true }),
      }
    );

    if (!authResponse.ok) {
      const authError = await authResponse.json();
      return NextResponse.json({
        success: false,
        error: `No se pudo autenticar con Firebase: ${authError.error?.message || 'Error desconocido'}`,
        hint: 'Verifica que la API key de Firebase sea válida. Si la API key fue restringida, necesitas actualizarla en la Firebase Console y en las variables de entorno de Vercel.'
      }, { status: 401 });
    }

    const authData = await authResponse.json();
    const idToken = authData.idToken;

    // Intentar publicar las reglas usando el token
    // NOTA: Este endpoint del Management API requiere permisos de editor del proyecto.
    // Si falla, las reglas deben publicarse manualmente desde Firebase Console.
    const rulesResponse = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/rules`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          source: {
            files: [
              {
                name: 'firestore.rules',
                content: rules,
              },
            ],
          },
        }),
      }
    );

    if (rulesResponse.ok) {
      const rulesData = await rulesResponse.json();
      return NextResponse.json({
        success: true,
        message: 'Reglas de Firestore publicadas exitosamente',
        rulesName: rulesData.name,
      });
    } else {
      const rulesError = await rulesResponse.json();
      
      // Si falla por permisos, dar instrucciones claras
      if (rulesResponse.status === 403 || rulesResponse.status === 401) {
        return NextResponse.json({
          success: false,
          error: 'El token anónimo no tiene permisos para publicar reglas.',
          rulesReady: true,
          rulesContent: rules,
          instructions: [
            '1. Ve a https://console.firebase.google.com/project/academic-tracker-qeoxi/firestore/rules',
            '2. Borra todo el contenido del editor de reglas',
            '3. Pega las reglas que aparecen abajo en "rulesContent"',
            '4. Haz clic en "Publicar"',
            '',
            'Después de publicar, las evaluaciones funcionarán inmediatamente.',
          ],
          manualRules: rules,
        }, { status: 403 });
      }

      return NextResponse.json({
        success: false,
        error: `Error al publicar reglas: ${rulesError.error?.message || 'Error desconocido'}`,
        rulesContent: rules,
      }, { status: rulesResponse.status });
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

// GET: Devuelve las reglas por defecto para copiar/pegar manualmente
export async function GET() {
  return NextResponse.json({
    message: 'Las reglas de Firestore deben publicarse manualmente.',
    instructions: [
      '1. Ve a Firebase Console → academic-tracker-qeoxi → Firestore Database → Reglas',
      '2. Borra todo el contenido actual',
      '3. Pega las reglas que están en "rules" abajo',
      '4. Haz clic en "Publicar"',
      '',
      'Después de publicar, ejecuta DELETE /api/deploy-rules para eliminar esta ruta.',
    ],
    rules: DEFAULT_RULES,
  });
}
