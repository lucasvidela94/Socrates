# Sócrates

Aplicación de escritorio para **docentes**: asistentes con IA que ayudan a elaborar **criterios de evaluación**, **planes de enseñanza**, **adecuaciones curriculares**, **consignas** y otros materiales del año lectivo. Conectada a un proveedor de modelo de lenguaje (LLM) elegido por la usuaria o el usuario.

## Motivación

Pensada para situaciones con alta carga docente (por ejemplo, varios turnos y más de 30 alumnos), donde la planificación repetitiva consume tiempo que puede destinarse al aula. La herramienta **empodera** al docente como supervisor: los agentes producen borradores, pero es el docente quien revisa, edita y aprueba.

## Arquitectura

```
socrates/
├── apps/
│   ├── desktop/          Electron + React + Tailwind + PGlite/Drizzle
│   └── agents/           Elixir/Phoenix (orquestación de agentes LLM)
├── Makefile              Comandos unificados
└── README.md
```

Electron (desktop) se comunica con el sidecar Elixir (agents) por **WebSocket en localhost**. El proceso main de Electron encuentra un puerto libre, levanta el binario Elixir como child process y se conecta a un Phoenix Channel (`agent:lobby`).

### Capas

| Capa | Stack | Responsabilidad |
|------|-------|-----------------|
| **UI** | React + Tailwind + shadcn/ui | Aulas, alumnos, devoluciones, chat, documentos, configuración |
| **Datos** | PGlite (Postgres WASM) + Drizzle ORM | Persistencia local: aulas, alumnos, devoluciones semanales, documentos, conversaciones, config LLM |
| **Agentes** | Elixir/Phoenix + Req | Orquestación, contexto enriquecido, salida JSON para exportación |
| **Exportación** | `docx` (npm) en el proceso main | Generación de archivos `.docx` locales |
| **Empaquetado** | electron-builder + Burrito | Un solo instalador por plataforma |

### Agentes

| Agente | Función |
|--------|---------|
| **Criterios** | Genera criterios de evaluación alineados al currículo |
| **Planificador** | Elabora planes semanales/mensuales |
| **Adecuación** | Adapta actividades según perfil y evolución de cada alumno |
| **Consignas** | Crea tareas, actividades y fichas de trabajo |

Los cuatro agentes anteriores responden en **JSON** (`title`, `summary`, `blocks`) para vista previa en pantalla y exportación a Word. Existe además un flujo interno `feedback_summary` para sugerir resúmenes de devolución semanal (siempre revisables por la docente).

## Requisitos

- **Node.js** (>= 20) y [pnpm](https://pnpm.io/)
- **Elixir** (>= 1.15) y Erlang/OTP (>= 25)

## Setup

```bash
# Instalar dependencias del desktop
make install

# Instalar dependencias del sidecar Elixir
cd apps/agents && mix deps.get && cd ../..
```

## Desarrollo

```bash
# Solo desktop (sin sidecar — la app arranca pero los agentes no responden)
make dev

# Solo sidecar Elixir
make dev-agents

# Ambos en paralelo
make dev-all
```

## Build y distribución

```bash
make build          # Compila desktop (main + renderer)
make build-agents   # Compila release de Elixir
make dist           # Empaqueta con electron-builder
```

## Tests

```bash
make test           # Tests del desktop (Vitest)
make test-agents    # Tests del sidecar (ExUnit)
```

## Modelo de datos (resumen)

- `teachers`, `classrooms`, `students` — estructura de aula
- `student_profiles`, `learning_notes` — perfil y observaciones por alumno
- `weekly_feedback` — devolución semanal por alumno (indicadores, observaciones, resumen IA, aprobación docente)
- `documents`, `document_versions` — documentos aprobados por la docente
- `conversations`, `messages` — historial de chat con los agentes
- `llm_config` — proveedor, modelo, API key

## Estado actual

- Monorepo con desktop (Electron + React) y agents (Elixir/Phoenix).
- PGlite + Drizzle con esquema ampliado (incluye `weekly_feedback`).
- UI: **Mis aulas**, **Devoluciones**, **Asistentes** (contexto de aula/alumnos), **Documentos**, **Configuración**.
- Sidecar con `ContextBuilder`: perfiles, notas y devoluciones recientes inyectadas en el system prompt.
- Llamadas reales al LLM (OpenAI / OpenRouter compatible) desde Elixir.
- Aprobación de borradores → tabla `documents` + nota opcional en ficha del alumno + exportación **DOCX**.

## Licencia

MIT.
# Socrates
