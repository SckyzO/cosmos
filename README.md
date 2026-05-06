# Cosmos

Design system for sckyzo's projects — React 19 + Tailwind 4 + Storybook 9.

Cosmos provides a shared CSS theme and a library of React components extracted
and refined from [rackscope](https://github.com/SckyzO/rackscope), reusable
across multiple projects (monitoring-hub-website, future portals, and rackscope
itself eventually).

## Packages

| Package | Description | Status |
|---|---|---|
| [`@sckyzo/cosmos-theme`](packages/theme) | Tailwind 4 theme (CSS only): tokens, fonts, dark mode | Phase 0 |
| [`@sckyzo/cosmos-react`](packages/react) | React component library (TSX) | Phase 1 |

## Apps

| App | Purpose | URL |
|---|---|---|
| [`apps/storybook`](apps/storybook) | Component showcase + visual testing | (CF Pages) |

## Development (everything in Docker)

The host needs only `docker`, `git`, `gh`, `make`, `bash`. No Node, no pnpm, no Playwright on the host.

```bash
make build-image       # Build cosmos-dev image (first time only)
make install           # pnpm install inside container
make storybook         # Start Storybook on http://localhost:6006
make test              # Run unit tests (Vitest)
make test-e2e          # Run Playwright e2e tests
make ci                # Full CI pipeline (lint + format + typecheck + test + build)
make help              # See all targets
```

Or via `./devctl`:

```bash
./devctl shell                      # Interactive shell in container
./devctl run pnpm <anything>        # Arbitrary pnpm command
./devctl storybook                  # Storybook dev server
```

## Versions

| Tool | Version |
|---|---|
| Node | 22 LTS |
| pnpm | 10.x |
| React | 19.x |
| Tailwind CSS | 4.x |
| Storybook | 9.x |
| Vite | 8.x |
| TypeScript | 5.9.x |
| Playwright | latest |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). All commits must be signed (SSH signing).

## License

MIT — see [LICENSE](LICENSE).
