FROM maven:3.9.9 AS maven

RUN mkdir /data
WORKDIR /data
COPY ./customization/src ./src
COPY ./customization/pom.xml ./pom.xml

RUN mvn clean package -Pdev

FROM quay.io/keycloak/keycloak:26.4.0 AS builder

# Enable health and metrics support
# ENV KC_HEALTH_ENABLED=true
# ENV KC_METRICS_ENABLED=true

# Configure a database vendor
# ENV KC_DB=postgres

WORKDIR /opt/keycloak

# Copy custom theme
# COPY --from=node /keywind/theme/ ./themes/

# for demonstration purposes only, please make sure to use proper certificates in production instead
# RUN keytool -genkeypair -storepass password -storetype PKCS12 -keyalg RSA -keysize 2048 -dname "CN=server" -alias server -ext "SAN:c=DNS:localhost,IP:127.0.0.1" -keystore conf/server.keystore
RUN /opt/keycloak/bin/kc.sh build

FROM quay.io/keycloak/keycloak:26.4.0
COPY --from=builder /opt/keycloak/ /opt/keycloak/

# ENV KC_DB=postgres
# ENV KC_DB_URL_HOST=postgres
# ENV KC_DB_SCHEMA=keycloak
# ENV KC_DB_USERNAME=keycloak
# ENV KC_DB_PASSWORD=keycloak
# ENV KC_HOSTNAME=auth.opendpp.localhost

USER root
COPY healthcheck.sh /opt/keycloak/bin/healthcheck.sh
RUN chmod +x /opt/keycloak/bin/healthcheck.sh
COPY disable-ssl-for-master-realm.sh /opt/keycloak/bin/disable-ssl-for-master-realm.sh
RUN chmod +x /opt/keycloak/bin/disable-ssl-for-master-realm.sh

USER keycloak
# Copy the custom .jar files
COPY --from=maven /data/target/deploy/ /opt/keycloak/providers/

WORKDIR /opt/keycloak

# --spi-theme-static-max-age=-1 --spi-theme-cache-themes=false --spi-theme-cache-templates=false

ENTRYPOINT [ "/opt/keycloak/bin/kc.sh" ]