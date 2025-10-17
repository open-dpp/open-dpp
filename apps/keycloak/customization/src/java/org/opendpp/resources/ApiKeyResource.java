package org.opendpp.resources;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Response;
import org.keycloak.models.*;
import org.keycloak.protocol.oidc.TokenManager;
import org.keycloak.representations.AccessToken;
import org.keycloak.services.util.DefaultClientSessionContext;
import org.opendpp.credentials.apikey.ApiKeyHelper;
import org.jboss.logging.Logger;
import org.opendpp.enums.OpenDppRealmConfigs;

import java.util.Map;

public class ApiKeyResource {

    protected static final Logger logger = Logger.getLogger(ApiKeyResource.class);

    private KeycloakSession session;

    public ApiKeyResource(KeycloakSession session) {
        this.session = session;
    }

    @GET
    @Path("check")
    @Produces("application/json")
    public Response checkApiKey(@QueryParam("apiKey") String apiKey) {
        UserModel foundUser = session.users().searchForUserStream(
                session.getContext().getRealm(),
                Map.of()
        ).filter(user -> ApiKeyHelper.validateUserCredentials(user, apiKey)).findFirst().orElse(null);

        Map<String, Object> response = Map.of(
            "valid", foundUser != null
        );

        return Response.ok(response).build();
    }

    @OPTIONS
    @Path("create")
    public Response handleCorsPreflightRequestOnCreateApiKey() {
        return Response.ok()
                .header("Access-Control-Allow-Origin", "*")
                .header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
                .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
                .header("Access-Control-Max-Age", "3600")
                .build();
    }

    @POST
    @Path("create")
    @Produces("application/json")
    public Response createApiKey(@HeaderParam("Authorization") String authorizationHeader) {
        UserModel authenticatedUser = null;

        // Try to get user from Bearer token
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            String token = authorizationHeader.substring(7); // Remove "Bearer " prefix
            try {
                // Decode and validate the token
                AccessToken accessToken = session.tokens().decode(token, AccessToken.class);
                if (accessToken != null) {
                    String userId = accessToken.getSubject();
                    authenticatedUser = session.users().getUserById(session.getContext().getRealm(), userId);
                }
            } catch (Exception e) {
                logger.error("Error decoding Bearer token: " + e.getMessage());
                return Response.status(401).entity("Invalid Bearer token").build();
            }
        }

        // Fallback to authentication session (for other auth methods)
        if (authenticatedUser == null) {
            authenticatedUser = session.getContext().getAuthenticationSession() != null
                ? session.getContext().getAuthenticationSession().getAuthenticatedUser()
                : null;
        }

        if (authenticatedUser == null) {
            return Response.status(401).entity("User not authenticated").build();
        }

        String userId = authenticatedUser.getId();

        String apiKey = ApiKeyHelper.addApiKeyCredential(session, session.getContext().getRealm(), userId);
        return apiKey.isEmpty() ? Response.status(401).build() : Response
                .ok(apiKey)
                .header("Access-Control-Allow-Origin", "*")
                .header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
                .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
                .build();
    }

    @GET
    @Path("auth")
    @Produces("application/json")
    public Response getAuthFromKey(@QueryParam("apiKey") String apiKey) {
        UserModel foundUser = session.users().searchForUserStream(
                session.getContext().getRealm(),
                Map.of()
        ).filter(user -> ApiKeyHelper.validateUserCredentials(user, apiKey)).findFirst().orElse(null);

        if (foundUser == null) {
            return Response.status(401).entity("API Key invalid").build();
        }

        // Create user session
        RealmModel realm = session.getContext().getRealm();
        ClientModel client = realm.getClientByClientId(OpenDppRealmConfigs.CLIENT_FRONTEND.getValue()); // or your specific client

        if (client == null) {
            return Response.status(500).entity("Client not found").build();
        }

        UserSessionModel userSession = session.sessions().createUserSession(
            realm,
            foundUser,
            foundUser.getUsername(),
            session.getContext().getConnection().getRemoteAddr(),
            "api-key-auth",
            false,
            null,
            null
        );

        // Create client session
        AuthenticatedClientSessionModel clientSession = session.sessions().createClientSession(
            realm,
            client,
            userSession
        );

        // Create ClientSessionContext
        ClientSessionContext clientSessionContext = DefaultClientSessionContext.fromClientSessionScopeParameter(clientSession, session);


        // Create access token using TokenManager
        TokenManager tokenManager = new TokenManager();
        session.getContext().setClient(client);
        AccessToken accessToken = tokenManager.createClientAccessToken(
            session,
            realm,
            client,
            foundUser,
            userSession,
            clientSessionContext
        );

        // Generate the JWT string
        String token = session.tokens().encode(accessToken);

        Map<String, Object> response = Map.of(
            "jwt", token
        );

        return Response.ok(response).build();
    }
}