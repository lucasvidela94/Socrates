# Socrates

Socrates es un asistente de escritorio open source para docentes. Ayuda a crear borradores de criterios de evaluación, planificaciones, tareas y adecuaciones, manteniendo siempre a la persona docente como responsable final de revisión y aprobación.

[Read in English](./README.md)

## Características

- Asistentes de IA para criterios, planificación, adecuaciones y tareas
- Contexto de aulas y alumnos con memoria evolutiva
- Flujo de devoluciones semanales con borradores revisables
- Exportación de documentos aprobados a DOCX
- Arquitectura desktop local-first

## Arquitectura

```
socrates/
├── apps/
│   ├── desktop/          Electron + React + Tailwind + PGlite/Drizzle
│   └── agents/           Sidecar Elixir/Phoenix para orquestación
└── Makefile
```

La app desktop (Electron) se comunica con el sidecar Elixir por WebSocket en localhost (`agent:lobby`).

## Requisitos

- Node.js >= 20
- pnpm
- Elixir >= 1.15
- Erlang/OTP >= 25

## Inicio rápido

```bash
make install
cd apps/agents && mix deps.get && cd ../..
make dev-all
```

## Comandos de desarrollo

```bash
make dev         # solo desktop
make dev-agents  # solo sidecar
make dev-all     # desktop + sidecar
make test        # tests desktop
make test-agents # tests Elixir
make build
make build-agents
make dist
```

## Open Source

- Licencia: Apache License 2.0 (`LICENSE`)
- Guía de contribución: `CONTRIBUTING.md`
- Código de conducta: `CODE_OF_CONDUCT.md`
- Política de seguridad: `SECURITY.md`

## Licencia

Apache-2.0
