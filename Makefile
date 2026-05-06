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
DOCKER_RUN := docker run --rm -v $(PWD):$(WORKSPACE) -w $(WORKSPACE) -u $(HOST_UID):$(HOST_GID) -e HOME=/home/node
DOCKER_RUN_IT := docker run -it --rm -v $(PWD):$(WORKSPACE) -w $(WORKSPACE) -u $(HOST_UID):$(HOST_GID) -e HOME=/home/node

# Compose env passed to docker compose (UID/GID for service users).
export UID := $(HOST_UID)
export GID := $(HOST_GID)

.PHONY: help build-image rebuild-image install lint lint-fix format format-check typecheck test test-e2e build storybook storybook-build clean shell ci compose-up compose-down

help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z_-]+:.*##/ { printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

build-image: ## Build cosmos-dev Docker image (UID/GID matched to host)
	docker build --build-arg USER_UID=$(HOST_UID) --build-arg USER_GID=$(HOST_GID) -t $(DEV_IMAGE) -f config/docker/Dockerfile.dev .

rebuild-image: ## Rebuild cosmos-dev image without cache
	docker build --no-cache --build-arg USER_UID=$(HOST_UID) --build-arg USER_GID=$(HOST_GID) -t $(DEV_IMAGE) -f config/docker/Dockerfile.dev .

install: ## pnpm install (in container, as host user)
	$(DOCKER_RUN) $(DEV_IMAGE) pnpm install

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
	$(DOCKER_RUN) $(DEV_IMAGE) pnpm test

storybook: ## Start Storybook via docker compose (http://localhost:6006)
	docker compose up storybook

storybook-detached: ## Start Storybook in background
	docker compose up -d storybook

storybook-build: ## Build Storybook static site
	$(DOCKER_RUN) $(DEV_IMAGE) pnpm storybook:build

test-e2e: ## Run Playwright e2e (auto-starts storybook via compose, screenshots in screenshots/)
	docker compose run --rm playwright bash -c "cd /workspace/tests/e2e && pnpm install --frozen-lockfile && pnpm test"

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
	$(DOCKER_RUN) $(DEV_IMAGE) sh -c "rm -rf node_modules packages/*/node_modules apps/*/node_modules tests/*/node_modules packages/*/dist apps/*/storybook-static playwright-report test-results coverage screenshots/*.png"

ci: ## Full CI pipeline (lint + format + typecheck + test + build)
	$(DOCKER_RUN) $(DEV_IMAGE) pnpm ci
