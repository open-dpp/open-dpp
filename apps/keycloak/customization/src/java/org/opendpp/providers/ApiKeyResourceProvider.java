package org.opendpp.providers;

import org.keycloak.models.KeycloakSession;
import org.keycloak.services.resource.RealmResourceProvider;
import org.opendpp.resources.ApiKeyResource;

public class ApiKeyResourceProvider implements RealmResourceProvider {

    private KeycloakSession session;

    public ApiKeyResourceProvider(KeycloakSession session) {
        this.session = session;
    }

    public Object getResource() {
        return new ApiKeyResource(session);
    }

    public void close() {}
}