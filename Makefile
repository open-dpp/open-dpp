dev:
	dotenvx run -f .env.dev -- docker compose -f docker-compose.dev.yml up -d

test:
	docker compose -f docker-compose.test.yml up -d

full:
	docker compose up -d

.PHONY: dev test full