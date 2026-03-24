# Contributing to Socrates

Thanks for your interest in contributing.

## How to contribute

1. Fork the repository and create a feature branch.
2. Keep changes focused and small.
3. Run tests before opening a pull request:
   - `make test`
   - `make test-agents`
4. Open a pull request with:
   - clear summary
   - rationale
   - test notes

## Development setup

```bash
make install
cd apps/agents && mix deps.get && cd ../..
make dev-all
```

## Code style

- Keep code modular and maintainable.
- Use descriptive names and avoid unnecessary complexity.
- Follow existing project conventions.

## Reporting issues

Please include:

- environment details
- reproduction steps
- expected vs actual behavior
- logs or screenshots when relevant

## License

By contributing, you agree that your contributions are licensed under Apache-2.0.
