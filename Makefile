keycloak-master-fix:
	docker exec keycloak /bin/bash /opt/keycloak/bin/disable-ssl-for-master-realm.sh

dev:
	dotenvx run -f .env.dev -- docker compose -f docker-compose.dev.yml up -d
	$(MAKE) keycloak-master-fix

test:
	docker compose -f docker-compose.test.yml up -d

full:
	docker compose up -d
	$(MAKE) keycloak-master-fix

.PHONY: keycloak-master-fix dev