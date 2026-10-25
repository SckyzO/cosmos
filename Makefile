# cosmos — Makefile (docker-driven, host-clean).
#
# Convention: every target runs inside containers as non-root user
# matching the host UID/GID (no permission issues on bind-mounted files).
# The host needs only: docker, git, gh, make.

.DEFAULT_GOAL := help

DEV_IMAGE := cosmos-dev:latest
WORKSPACE := /workspace
HOST_UID := $(shell id -u)
HOST_GID := $(shell id -g)
# .git is mounted read-only on top of the workspace: code running in the
# container (install scripts, dev dependencies) could otherwise write
# .git/hooks or .git/config, which git runs on the host.
DOCKER_RUN := docker run --rm -v $(PWD):$(WORKSPACE) -v $(PWD)/.git:$(WORKSPACE)/.git:ro -w $(WORKSPACE) -u $(HOST_UID):$(HOST_GID) -e HOME=/home/node
DOCKER_RUN_IT := docker run -it --rm -v $(PWD):$(WORKSPACE) -v $(PWD)/.git:$(WORKSPACE)/.git:ro -w $(WORKSPACE) -u $(HOST_UID):$(HOST_GID) -e HOME=/home/node

# Compose env passed to docker compose (UID/GID for service users).
export UID := $(HOST_UID)
export GID := $(HOST_GID)

.PHONY: help build-image rebuild-image install report-update update lint lint-fix format format-check typecheck test test-contrast test-e2e screenshots visual-diff audit-captures build storybook storybook-build clean shell ci compose-up compose-down

help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z_-]+:.*##/ { printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

build-image: ## Build cosmos-dev Docker image (UID/GID matched to host)
	docker build --build-arg USER_UID=$(HOST_UID) --build-arg USER_GID=$(HOST_GID) -t $(DEV_IMAGE) -f config/docker/Dockerfile.dev .

rebuild-image: ## Rebuild cosmos-dev image without cache
	docker build --no-cache --build-arg USER_UID=$(HOST_UID) --build-arg USER_GID=$(HOST_GID) -t $(DEV_IMAGE) -f config/docker/Dockerfile.dev .

install: ## pnpm install + the Playwright browsers the lockfile pins (in container, as host user)
	$(DOCKER_RUN) $(DEV_IMAGE) sh -c "pnpm install && pnpm browsers:install"

report-update: ## Report outdated dependencies across all workspaces (read-only)
	@$(DOCKER_RUN) $(DEV_IMAGE) pnpm outdated -r || true

update: ## Update ALL deps to latest (majors included) + refresh lockfile — run `make ci` after
	$(DOCKER_RUN) $(DEV_IMAGE) sh -c "pnpm update -r --latest && pnpm browsers:install"

lint: ## ESLint on all workspaces
	$(DOCKER_RUN) $(DEV_IMAGE) pnpm lint

lint-fix: ## ESLint --fix
	$(DOCKER_RUN) $(DEV_IMAGE) pnpm lint:fix

format: ## Prettier --write
	$(DOCKER_RUN) $(DEV_IMAGE) pnpm format

format-check: ## Prettier --check
	$(DOCKER_RUN) $(DEV_IMAGE) pnpm format:check

typecheck: ## tsc --noEmit on all workspaces
	$(DOCKER_RUN) $(DEV_IMAGE) pnpm typecheck

test: ## Vitest unit tests
	$(DOCKER_RUN) $(DEV_IMAGE) sh -c "pnpm browsers:install && pnpm test"

test-contrast: ## axe color-contrast on every story in light, sand and deep-blue. One theme: A11Y_THEME=sand
	$(DOCKER_RUN) -e A11Y_THEME $(DEV_IMAGE) sh -c "pnpm browsers:install && pnpm --filter @cosmos/storybook a11y:contrast"

storybook: ## Start Storybook via docker compose (http://localhost:6006)
	docker compose up storybook

storybook-detached: ## Start Storybook in background
	docker compose up -d storybook

storybook-build: ## Build Storybook static site
	$(DOCKER_RUN) $(DEV_IMAGE) pnpm storybook:build

test-e2e: ## Run Playwright e2e (auto-starts storybook via compose)
	docker compose run --rm playwright bash -c "cd /workspace/tests/e2e && pnpm install --frozen-lockfile && pnpm -w browsers:install && pnpm test"

screenshots: ## Capture every story in each theme into screenshots/<theme>/ (not in CI). Filters: STORIES=<id substring> THEMES=<theme>
	docker compose run --rm -e STORIES -e THEMES -e CAPTURE_PAGES -e CAPTURE_VIEWPORT playwright bash -c "cd /workspace/tests/e2e && pnpm install --frozen-lockfile && pnpm -w browsers:install && pnpm screenshots"

visual-diff: ## Visual diff of some stories, BASE (default main) vs the working tree: STORIES=<id substrings> [THEMES=<themes>] [BASE=<ref>]
	@tests/e2e/captures/visual-review.sh

audit-captures: ## Captures for the visual audit, into ../cosmos-references/cosmos: [REFERENCES=<path>] [THEMES=<themes>] [STORIES=…] [MOBILE_STORIES=…]
	@tests/e2e/captures/audit-captures.sh

build: ## Build all packages
	$(DOCKER_RUN) $(DEV_IMAGE) pnpm build

shell: ## Interactive shell inside cosmos-dev (as host user)
	$(DOCKER_RUN_IT) $(DEV_IMAGE) bash

playwright-shell: ## Interactive shell inside playwright container
	docker compose run --rm playwright bash

compose-up: ## Start all compose services in background
	docker compose up -d

compose-down: ## Stop and remove all compose services
	docker compose down

clean: ## Remove node_modules, dist, build artifacts, screenshots
	$(DOCKER_RUN) $(DEV_IMAGE) sh -c "rm -rf node_modules packages/*/node_modules apps/*/node_modules tests/*/node_modules packages/*/dist apps/*/storybook-static playwright-report test-results coverage screenshots/*/ screenshots/problems.txt"

ci: ## Full CI pipeline — mirrors .github/workflows/ci.yml (run BEFORE every push)
	$(DOCKER_RUN) $(DEV_IMAGE) sh -c "set -e; \
	  echo '── 1. lint ──' && pnpm lint && \
	  echo '── 2. format:check ──' && pnpm format:check && \
	  echo '── 3. typecheck ──' && pnpm typecheck && \
	  echo '── 4. build packages ──' && pnpm build && \
	  echo '── 5. storybook:build ──' && pnpm storybook:build && \
	  echo '── 6. unit + e2e tests ──' && pnpm browsers:install && CI=true pnpm test && \
	  echo '── 7. story contrast in light, sand, deep-blue ──' && CI=true pnpm --filter @cosmos/storybook a11y:contrast && \
	  echo '── ALL GREEN ──'"
