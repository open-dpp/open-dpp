package org.opendpp.credentials.apikey;

import org.jboss.logging.Logger;
import org.keycloak.authentication.AuthenticationFlowContext;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserModel;
import org.opendpp.enums.CustomCredentials;

import java.util.UUID;

public class ApiKeyHelper {

    protected static final Logger logger = Logger.getLogger(ApiKeyHelper.class);

    public static String addApiKeyCredential(KeycloakSession session, RealmModel realm, String userId) {
        UserModel user = session.users().getUserById(realm, userId);
        if (user == null) {
            return "";
        }
        String apiKey = UUID.randomUUID().toString();
        ApiKeyCredentialModel apiKeyCredentialModel = ApiKeyCredentialModel.createApiKey(apiKey, userId);
        user.credentialManager().createStoredCredential(apiKeyCredentialModel);
        return apiKey;
   }

   public static boolean validateUserCredentials(UserModel user, String apiKey) {
        return user.credentialManager().getStoredCredentialsStream().anyMatch(credential -> {
            logger.info(credential.getType() + " " + apiKey + " " + credential.getType().equals(CustomCredentials.API_KEY.name()));
            if (credential.getType().equals(CustomCredentials.API_KEY.name())) {
                ApiKeyCredentialModel cred = ApiKeyCredentialModel.createFromCredentialModel(credential);
                logger.info(cred.getApiKeySecretData().getApiKey());
                return cred.getApiKeySecretData().getApiKey().equals(apiKey);
            }
            return false;
        });
    }
}
