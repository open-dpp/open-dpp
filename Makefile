dev:
	dotenvx run -f .env.dev -- docker compose -f docker-compose.dev.yml up -d

test:
	docker compose -f docker-compose.test.yml up -d

full:
	docker compose up -d

clean-pnpm:
	find . -name "node_modules" -type d -prune -exec rm -rf '{}' +
	find . -name "pnpm-lock.yaml" -type f -delete
	pnpm i

clean-turbo:
	find . -name ".turbo" -type d -prune -exec rm -rf '{}' +

clean-dist:
	find . -name "dist" -type d -prune -exec rm -rf '{}' +

.PHONY: dev test full clean-pnpm clean-turbo clean-dist