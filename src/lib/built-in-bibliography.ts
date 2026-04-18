// ============================================================================
// BUILT-IN CLINICAL BIBLIOGRAPHY — Integrated into the application code
// This library is ALWAYS available for AI treatment plan generation.
// It serves as the base knowledge foundation for every student case.
// Users can supplement it with additional uploads via the Bibliography dialog.
// ============================================================================

export interface BibliographyEntry {
    title: string;
    author: string;
    year: number;
    model: string;
    content: string;
}

export const BUILT_IN_BIBLIOGRAPHY: BibliographyEntry[] = [
    {
        title: 'Terapia Cognitivo-Conductual: Fundamentos y Aplicaciones Clínicas',
        author: 'Beck, J. S.',
        year: 2011,
        model: 'TCC',
        content: `La Terapia Cognitivo-Conductual (TCC) es un enfoque terapéutico estructurado, de tiempo limitado, que se basa en el modelo cognitivo el cual postula que los trastornos emocionales y conductuales son mediados fundamentalmente por distorsiones y creencias disfuncionales en el procesamiento de la información. El objetivo central de la TCC es identificar, evaluar y modificar las cogniciones distorsionadas y las creencias nucleares disfuncionales que mantienen el malestar psicológico.

Técnicas principales de la TCC:
a) Reestructuración cognitiva: Identificación de pensamientos automáticos negativos, evaluación de la evidencia a favor y en contra de cada pensamiento, generación de pensamientos alternativos más realistas y funcionales.
b) Experimentos conductuales: Diseño de actividades para poner a prueba las creencias disfuncionales del paciente y generar evidencia que contradiga sus predicciones catastróficas.
c) Activación conductual: Programación gradual de actividades placenteras y de dominio para romper el ciclo de inactividad, retraimiento y depresión. Se construye una jerarquía de actividades de menor a mayor dificultad.
d) Resolución de problemas: Entrenamiento en un método sistemático de cinco pasos: definición del problema, generación de alternativas, evaluación de pros y contras, selección de la mejor opción, implementación y evaluación.
e) Entrenamiento en habilidades: Desarrollo de competencias en comunicación asertiva, establecimiento de límites, manejo del tiempo y habilidades sociales.
f) Psicoeducación: Provisión de información al paciente sobre su diagnóstico, el modelo cognitivo-conductual y el rationale de las intervenciones propuestas.

En el contexto educativo con adolescentes, la TCC ha demostrado eficacia en el tratamiento de la depresión, ansiedad, trastornos de la conducta alimentaria y manejo de la ira. Se adapta incorporando lenguaje accesible, metáforas visuales, tareas entre sesiones breves y la participación activa de padres o tutores cuando es pertinente. La duración típica oscila entre 8 y 20 sesiones, dependiendo de la complejidad del caso.`
    },
    {
        title: 'Guía Clínica de Activación Conductual para Depresión',
        author: 'Lejuez, C. W., Hopko, D. R. y Hopko, S. D.',
        year: 2001,
        model: 'AC',
        content: `La Activación Conductual (AC) es un componente central del tratamiento cognitivo-conductual para la depresión, basado en la premisa teórica de que la conducta de evitación y el retraimiento social son factores principales que mantienen y exacerban el estado depresivo. A diferencia de la reestructuración cognitiva clásica, la AC se enfoca directamente en la modificación del repertorio conductual del paciente como mecanismo de cambio.

Protocolo de implementación:
Paso 1 - Monitoreo de actividades: El paciente registra diariamente sus actividades, calificando cada una en una escala de placer (0-10) y dominio/competencia (0-10). Esto permite identificar patrones de evitación y el grado de desconexión con actividades previamente reforzantes.

Paso 2 - Análisis funcional de la evitación: Se identifica qué situaciones, pensamientos o emociones anteceden la conducta de evitación, qué conducta específica se realiza (o se evita) y cuáles son las consecuencias a corto plazo (alivio temporal) y largo plazo (mantenimiento del problema).

Paso 3 - Construcción de jerarquía de actividades: Se elabora una lista de actividades graduadas, desde las más fáciles hasta las más desafiantes, considerando tanto actividades de placer como de dominio. Se priorizan tareas que el paciente pueda completar con alta probabilidad de éxito inicial para generar autoeficacia.

Paso 4 - Programación y asignación de tareas: Se programan actividades concretas con día, hora y duración específica. Se negocian tareas entre sesiones que sean realistas, medibles y que representen un desafío moderado (ni muy fáciles ni imposibles).

Paso 5 - Monitoreo de resultados y ajuste: En cada sesión se revisan las actividades completadas, se analizan las barreras que impidieron la realización de las tareas y se ajusta la jerarquía según los resultados obtenidos.

En población adolescente, la AC es particularmente efectiva cuando se incluyen actividades que involucren interacción social, actividades físicas y hobbies previamente disfrutados. Se recomienda incorporar refuerzos naturales inmediatos y celebrar los avances por pequeños que sean.`
    },
    {
        title: 'Terapia Dialéctico-Conductual: Habilidades de Entrenamiento',
        author: 'Linehan, M. M.',
        year: 2014,
        model: 'DBT',
        content: `La Terapia Dialéctico-Conductual (DBT) fue desarrollada originalmente para el tratamiento del Trastorno Límite de la Personalidad y ha demostrado amplia eficacia en la reducción de conductas suicidas, autolesivas y de desregulación emocional. En el contexto clínico educativo, las habilidades de DBT se aplican de manera modular para adolescentes con dificultades en la regulación emocional, alta impulsividad y riesgo suicida.

Módulos de habilidades DBT:

1. Mindfulness (Conciencia Plena): Entrenamiento en la capacidad de observar y describir la experiencia presente sin juzgar, sin intentar eliminar ni aferrarse a pensamientos, emociones o sensaciones. Incluye las habilidades "Qué" (observar, describir, participar) y "Cómo" (sin juzgar, un mente de principiante, ser efectivo, actuar con conciencia).

2. Regulación Emocional: Identificación y etiquetado de emociones, reducción de la vulnerabilidad emocional (cuidado del cuerpo con sueño, alimentación y ejercicio adecuados), aumento de eventos emocionales positivos, uso de la opuesta a la emoción (por ejemplo, frente a la tristeza, actuar de manera opuesta a la conducta asociada a la tristeza), y tolerancia al malestar.

3. Tolerancia al Malestar: Habilidades para sobrevivir crisis sin empeorar la situación. Incluye la técnica TIP (Temperatura del cuerpo con agua fría, Ejercicio intenso, Respiración pausada), distracción con actividades, comparación con otros que sufren más, generar emociones opuestas, autosensorial (cinco sentidos), abandono del cuerpo (imaginación), oración/relajación y signifcado (encontrar propósito en el sufrimiento).

4. Efectividad Interpersonal: Entrenamiento en habilidades sociales para pedir lo que se necesita, decir no, manejar conflictos y mantener la autoestima en las relaciones. Incluye el modelo DEAR MAN (Describir la situación, Expresar sentimientos, Afirmar, Reafirmar, Mantenerse firme, Aparecer confidente, Negociar).

En la aplicación con adolescentes, se recomienda adaptar el lenguaje, usar ejemplos relevantes a su contexto escolar y familiar, e involucrar a los padres en el entrenamiento de habilidades cuando sea posible. La duración del tratamiento DBT completo es típicamente de 12 meses, pero las habilidades pueden enseñarse de forma modular en intervenciones más breves.`
    },
    {
        title: 'Evaluación y Manejo del Riesgo Suicida en Adolescentes',
        author: 'Bouchard, J. y Marshall, W. L.',
        year: 2018,
        model: 'Riesgo Suicida',
        content: `La evaluación del riesgo suicida en adolescentes requiere un enfoque multinivel que considere factores estáticos (historia familiar de suicidio, intentos previos), factores dinámicos (ideación suicida actual, planes, acceso a medios, desesperanza) y factores protectores (conexión familiar, participación escolar, razones para vivir).

Protocolo de evaluación del riesgo suicida:
Nivel 1 - Tamizaje universal: Aplicación de instrumentos estandarizados (Columbia-Suicide Severity Rating Scale, C-SSRS; Inventario de Ideación Suicida de Beck, SSI) a toda la población estudiantil como parte de la detección sistemática.

Nivel 2 - Evaluación focalizada: Para estudiantes identificados en tamizaje, se realiza una entrevista clínica semiestructurada que explore: ideación suicida (frecuencia, duración, intensidad), planes específicos (método, acceso a medios, lugar, momento), intentos previos (número, métodos, letalidad, antecedentes de atención médica), intentos recientes de autoeliminación, uso de sustancias, antecedentes familiares de suicidio o trastorno mental, cambios recientes en el estado de ánimo o comportamiento, reasons for living (razones para vivir).

Nivel 3 - Intervención intensiva: Para casos de riesgo alto o crítico, se activa el protocolo de emergencia que incluye: notificación inmediata a padres o tutores, derivación a servicio de urgencias psiquiátricas si es necesario, establecimiento de un plan de seguridad escrito con el adolescente, restricción del acceso a medios letales, seguimiento diario durante la primera semana y programación de sesiones frecuentes (mínimo 2 por semana).

Plan de seguridad: Documento escrito elaborado en colaboración con el adolescente que incluye: señales de advertencia personales, estrategias de afrontamiento internas (p. ej., técnicas de respiración, distracción), personas de confianza a quienes acudir, números de emergencia, compromiso de no autoeliminación durante un período acordado, y pasos a seguir si la urgencia aumenta.

Factores protectores a fortalecer: Conexión con al menos un adulto significativo, participación en actividades extracurriculares, habilidades de resolución de problemas, creencias religiosas o espirituales, metas futuras, redes de apoyo social, y competencia académica percibida.`
    },
    {
        title: 'Formulación Cognitiva del Caso Clínico',
        author: 'Persons, J. B.',
        year: 2008,
        model: 'TCC',
        content: `La formulación cognitiva del caso es una hipótesis integradora que explica cómo los pensamientos, emociones, conductas y experiencias de vida del paciente se interrelacionan para mantener el problema actual. Es la guía conceptual que dirige todo el proceso terapéutico.

Componentes de la formulación cognitiva:

1. Creencias nucleares (schemas): Son las creencias más profundas y rígidas que la persona tiene sobre sí misma, los demás y el mundo. Se originan en experiencias tempranas y se activan en situaciones que las confirman. Ejemplos comunes: "Soy incompetente", "No soy digno de ser amado", "El mundo es peligrosamente impredecible", "Si muestro mi verdadero yo, me rechazarán".

2. Creencias intermedias: Son reglas, actitudes y suposiciones que derivan de las creencias nucleares y operan como estándares rígidos para evaluar las experiencias. Ejemplos: "Si cometo un error, significa que soy un fracaso total", "Si alguien me critica, significa que no me valora", "Debo ser perfecto para ser aceptado".

3. Pensamientos automáticos: Son cogniciones espontáneas, rápidas y no evaluadas que surgen ante situaciones específicas y están influidos por las creencias subyacentes. Pueden ser distorsiones cognitivas (catastrofización, abstracción selectiva, personalización, pensamiento dicotómico, sobregeneralización, entre otras).

4. Esquemas de afrontamiento: Son los patrones de conducta compensatorios que el paciente desarrolla para manejar el malestar asociado a sus creencias. Pueden ser funcionales (adaptativos) o disfuncionales (evitación, hipervigilancia, sumisión, autoculpabilización).

La formulación se construye de manera colaborativa con el paciente, se revisa y ajusta continuamente a lo largo del tratamiento, y sirve como mapa para seleccionar las intervenciones más apropiadas. En adolescentes, la formulación debe considerar las etapas del desarrollo cognitivo y socioemocional, el contexto familiar y escolar, y las influencias culturales.`
    },
    {
        title: 'Estrategias Psicoeducativas para el Entorno Escolar',
        author: 'Zimmerman, B. J.',
        year: 2002,
        model: 'Psicoeducación',
        content: `La psicoeducación en el entorno escolar consiste en la provisión de información estructurada al estudiante, a su familia y al personal docente sobre las dificultades emocionales, conductuales y académicas identificadas, con el objetivo de promover la comprensión del problema, reducir el estigma, fortalecer la alianza terapéutica y facilitar la adherencia al tratamiento.

Componentes de la intervención psicoeducativa escolar:

1. Psicoeducación al estudiante: Explicación adaptada a su nivel de desarrollo sobre lo que le ocurre (p. ej., "la ansiedad es una respuesta normal del cuerpo que en tu caso se activa con demasiada intensidad"), qué es y cómo funciona la terapia, qué puede esperar del proceso terapéutico, y qué papel activo debe desempeñar. Se utilizan metáforas, analogías y material visual para facilitar la comprensión.

2. Psicoeducación a la familia: Información a padres o tutores sobre la naturaleza del problema, factores que lo mantienen, estrategias de manejo en el hogar, signos de alarma que requieren atención inmediata, y la importancia de un ambiente familiar contenedor, predecible y emocionalmente seguro.

3. Psicoeducación al personal docente: Orientación al profesorado sobre las necesidades específicas del estudiante, adaptaciones curriculares razonables (tiempo adicional en exámenes, reducción de carga cuando sea necesario, ubicación estratégica en el salón), estrategias de manejo conductual en el aula, y criterios para la derivación oportuna al servicio de orientación.

4. Entrenamiento en autorregulación: Enseñanza de técnicas de autobservación, autoevaluación y automanejo que permitan al estudiante monitorear su propio estado emocional, identificar señales tempranas de desregulación y activar estrategias de afrontamiento de forma autónoma. La técnica de los 5 minutos (comenzar una tarea difícil por solo 5 minutos para superar la barrera de inicio) y la segmentación de tareas (chunking) son estrategias particularmente útiles para adolescentes con problemas de procrastinación académica.`
    },
];

/**
 * Get the complete built-in bibliography as formatted text for AI context.
 * This is automatically included in every treatment plan generation.
 */
export function getBuiltInBibliographyText(): string {
    if (BUILT_IN_BIBLIOGRAPHY.length === 0) return '';

    const sections = BUILT_IN_BIBLIOGRAPHY.map((entry, index) => {
        return [
            `REFERENCIA ${index + 1}: ${entry.title}`,
            `Autor: ${entry.author} (${entry.year})`,
            `Modelo/Enfoque: ${entry.model}`,
            '',
            entry.content,
        ].join('\n');
    });

    return `=== BIBLIOTECA CLÍNICA INTEGRADA (${BUILT_IN_BIBLIOGRAPHY.length} fuentes) ===\n\n` + sections.join('\n\n---\n\n');
}

/**
 * Get a summary of available built-in sources.
 */
export function getBuiltInBibliographySummary(): { title: string; author: string; model: string }[] {
    return BUILT_IN_BIBLIOGRAPHY.map((e) => ({
        title: e.title,
        author: `${e.author} (${e.year})`,
        model: e.model,
    }));
}
