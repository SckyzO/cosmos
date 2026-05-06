# cosmos — Makefile (docker-driven, host-clean).
#
# Convention: every target runs inside the cosmos-dev container.
# The host needs only: docker, git, gh, make.

.DEFAULT_GOAL := help

DEV_IMAGE := cosmos-dev:latest
WORKSPACE := /workspace
DOCKER_RUN := docker run --rm -v $(PWD):$(WORKSPACE) -w $(WORKSPACE)
DOCKER_RUN_IT := docker run -it --rm -v $(PWD):$(WORKSPACE) -w $(WORKSPACE)
DOCKER_RUN_SB := docker run --rm -v $(PWD):$(WORKSPACE) -w $(WORKSPACE) -p 6006:6006

.PHONY: help build-image rebuild-image install lint lint-fix format format-check typecheck test test-e2e build storybook clean shell ci

help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z_-]+:.*##/ { printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

build-image: ## Build cosmos-dev Docker image
	docker build -t $(DEV_IMAGE) -f config/docker/Dockerfile.dev .

rebuild-image: ## Rebuild cosmos-dev image from scratch
	docker build --no-cache -t $(DEV_IMAGE) -f config/docker/Dockerfile.dev .

install: ## pnpm install (in container)
	$(DOCKER_RUN) $(DEV_IMAGE) pnpm install

lint: ## ESLint + stylelint (in container)
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

test-e2e: ## Playwright e2e tests against built Storybook
	$(DOCKER_RUN) $(DEV_IMAGE) pnpm test:e2e

build: ## Build all packages + storybook static
	$(DOCKER_RUN) $(DEV_IMAGE) pnpm build

storybook: ## Run Storybook dev server (localhost:6006)
	$(DOCKER_RUN_SB) $(DEV_IMAGE) pnpm storybook --host 0.0.0.0

storybook-build: ## Build Storybook static site
	$(DOCKER_RUN) $(DEV_IMAGE) pnpm storybook:build

shell: ## Interactive shell inside cosmos-dev
	$(DOCKER_RUN_IT) $(DEV_IMAGE) bash

clean: ## Remove node_modules, dist, build artifacts
	$(DOCKER_RUN) $(DEV_IMAGE) sh -c "rm -rf node_modules packages/*/node_modules apps/*/node_modules tests/*/node_modules packages/*/dist storybook-static playwright-report test-results coverage"

ci: ## Full CI pipeline (lint + format + typecheck + test + build)
	$(DOCKER_RUN) $(DEV_IMAGE) pnpm ci
