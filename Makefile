.PHONY: install dev build test dist clean dev-agents build-agents

# --- Desktop (Electron + React) ---

install:
	cd apps/desktop && pnpm install

dev:
	cd apps/desktop && pnpm dev

build:
	cd apps/desktop && pnpm build

test:
	cd apps/desktop && pnpm test

dist:
	cd apps/desktop && pnpm dist

# --- Agents (Elixir/Phoenix) ---

dev-agents:
	cd apps/agents && mix phx.server

build-agents:
	cd apps/agents && MIX_ENV=prod mix release

test-agents:
	cd apps/agents && mix test

# --- All ---

dev-all:
	$(MAKE) -j2 dev dev-agents

clean:
	rm -rf apps/desktop/dist apps/desktop/node_modules apps/agents/_build apps/agents/deps
