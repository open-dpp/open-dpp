package org.opendpp.mapper;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.keycloak.models.ClientSessionContext;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.ProtocolMapperModel;
import org.keycloak.models.UserSessionModel;
import org.keycloak.protocol.oidc.mappers.*;
import org.keycloak.provider.ProviderConfigProperty;
import org.keycloak.representations.IDToken;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import org.jboss.logging.Logger;

public class CustomOrganizationMapper extends AbstractOIDCProtocolMapper implements OIDCAccessTokenMapper,
        OIDCIDTokenMapper, UserInfoTokenMapper {

    public static final String PROVIDER_ID = "custom-organization-mapper";
    private static final List<ProviderConfigProperty> configProperties = new ArrayList<>();
    private static final Logger LOG = Logger.getLogger(CustomOrganizationMapper.class);
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    static {
        OIDCAttributeMapperHelper.addTokenClaimNameConfig(configProperties);
        OIDCAttributeMapperHelper.addIncludeInTokensConfig(configProperties, CustomOrganizationMapper.class);
    }

    @Override
    public String getDisplayCategory() {
        return "Token Mapper";
    }

    @Override
    public String getDisplayType() {
        return "Custom Organization Mapper";
    }

    @Override
    public String getHelpText() {
        return "Adds open-dpp organizations to the token";
    }

    @Override
    public List<ProviderConfigProperty> getConfigProperties() {
        return configProperties;
    }

    @Override
    public String getId() {
        return PROVIDER_ID;
    }

    @Override
    protected void setClaim(IDToken token, ProtocolMapperModel mappingModel,
                            UserSessionModel userSession, KeycloakSession keycloakSession,
                            ClientSessionContext clientSessionCtx) {
        String userId = userSession.getUser() != null ? userSession.getUser().getId() : null;
        if (userId == null || userId.isBlank()) {
            LOG.warn("CustomOrganizationMapper: userId is null/blank; setting empty organizations list");
            OIDCAttributeMapperHelper.mapClaim(token, mappingModel, Collections.emptyList());
            return;
        }

        String base = System.getenv("ORG_SERVICE_URL");
        if (base == null || base.isBlank()) {
            // Default/fallback shape can be adjusted as needed
            base = "http://api:3000/api/users/%s/organizations";
        }
        String url = base.contains("%s") ? String.format(base, userId) : base + "/api/users/" + userId + "/organizations";

        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(3))
                .build();

        HttpRequest.Builder reqBuilder = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(5))
                .GET();

        String apiKey = System.getenv("ORG_SERVICE_API_KEY");
        if (apiKey != null && !apiKey.isBlank()) {
            reqBuilder.header("service_token", "serviceToken");
        }

        List<String> organizations = Collections.emptyList();
        try {
            HttpResponse<String> resp = client.send(reqBuilder.build(), HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() >= 200 && resp.statusCode() < 300) {
                String body = resp.body();
                if (body != null && !body.isBlank()) {
                    organizations = OBJECT_MAPPER.readValue(body, new TypeReference<List<String>>() {});
                } else {
                    LOG.debug("CustomOrganizationMapper: empty response body; using empty organizations list");
                }
            } else {
                LOG.warnf("CustomOrganizationMapper: non-2xx status from org service: %d", resp.statusCode());
            }
        } catch (Exception e) {
            LOG.warn("CustomOrganizationMapper: error fetching organizations", e);
        }

        OIDCAttributeMapperHelper.mapClaim(token, mappingModel, organizations);
    }


}