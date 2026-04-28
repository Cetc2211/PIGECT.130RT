# Contribuir a PIGEC-130

Gracias por sumar al proyecto. Estas reglas existen para que el equipo clínico y los desarrolladores trabajen sin fricciones y los expedientes nunca se pongan en riesgo.

## Flujo de trabajo

1. **Todas las tareas viven en ramas**, nunca commits directos a `main`.
   - `feature/<nombre-corto>` — funcionalidad nueva
   - `fix/<nombre-corto>` — corrección
   - `refactor/<nombre-corto>` — reorganización interna
   - `docs/<nombre-corto>` — solo documentación

2. **Commits pequeños con mensajes claros.** Formato convencional:
   ```
   feat: agrega exportación cifrada de expedientes
   fix: corrige cálculo de percentil en PROLEC
   refactor: extrae lógica de validación a hook propio
   docs: actualiza guía de instalación iPad
   chore: actualiza dependencias menores
   ```

3. **Pull request para cada cambio.** Descripción clara: qué problema resuelve, qué probaste, capturas si afecta UI.

4. **CI debe estar verde** antes de mergear: lint, typecheck, build y tests.

5. **Revisión obligatoria.** Al menos un miembro del equipo aprueba antes de merge.

## Ética del código clínico

PIGEC-130 gestiona datos sensibles de adolescentes. Estas reglas no son negociables:

- **Nunca loguees datos del estudiante** en consola, telemetría, ni logs de error fuera del dispositivo del clínico.
- **Nunca envíes datos del expediente a servicios externos** salvo al proveedor de IA configurado explícitamente por el clínico, y solo los campos estrictamente necesarios para la tarea.
- **Toda interacción con IA debe ser auditada.** Queda registro local de qué se envió, qué se recibió, cuándo.
- **La validación humana del clínico es innegociable.** Ninguna impresión diagnóstica puede formar parte del expediente sin firma digital del clínico.

## Estilo de código

- TypeScript estricto. `any` requiere justificación en comentario.
- Componentes funcionales React con hooks. No clases nuevas.
- Estilos con Tailwind. Evitar CSS custom salvo necesidad real.
- Funciones puras cuando sea posible. Side effects aislados.

## Reportar problemas

- **Error técnico**: abrir issue en GitHub con pasos para reproducir.
- **Error clínico o de protocolo**: hablar con el equipo clínico antes de abrir issue. Hay decisiones que no se resuelven en código.
- **Vulnerabilidad de seguridad**: reportar por canal privado, no issue público.

## Preguntas

Si tienes dudas sobre cualquier cosa, pregunta al equipo. El costo de una pregunta es minutos; el costo de un error en datos clínicos puede ser mucho mayor.
