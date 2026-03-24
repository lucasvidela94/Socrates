# Socrates

Socrates is an open-source desktop assistant for teachers. It helps draft evaluation criteria, lesson plans, tasks, and student adaptations while keeping teachers in full control of review and approval.

[Leer en español](./README.es.md)

## Features

- AI assistants for criteria, planning, adaptations, and tasks
- Classroom and student context with progressive memory
- Weekly feedback workflows and reviewable drafts
- DOCX export for approved documents
- Local-first desktop architecture

## Architecture

```
socrates/
├── apps/
│   ├── desktop/          Electron + React + Tailwind + PGlite/Drizzle
│   └── agents/           Elixir/Phoenix sidecar for agent orchestration
└── Makefile
```

Desktop (Electron) communicates with the Elixir sidecar over localhost WebSocket (`agent:lobby`).

## Requirements

- Node.js >= 20
- pnpm
- Elixir >= 1.15
- Erlang/OTP >= 25

## Quick Start

```bash
make install
cd apps/agents && mix deps.get && cd ../..
make dev-all
```

## Development Commands

```bash
make dev         # desktop only
make dev-agents  # agents sidecar only
make dev-all     # desktop + sidecar
make test        # desktop tests
make test-agents # Elixir tests
make build       # desktop build
make build-agents
make dist
```

## Open Source

- License: Apache License 2.0 (`LICENSE`)
- Contributing guide: `CONTRIBUTING.md`
- Code of Conduct: `CODE_OF_CONDUCT.md`
- Security policy: `SECURITY.md`

## License

Apache-2.0
