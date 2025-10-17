package org.opendpp.credentials.apikey;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import org.keycloak.common.util.Time;
import org.keycloak.credential.CredentialModel;
import org.keycloak.models.utils.Base32;
import org.keycloak.util.JsonSerialization;
import org.opendpp.enums.CustomCredentials;

public class ApiKeyCredentialModel extends CredentialModel {

    public static final String TYPE = CustomCredentials.API_KEY.name();

    /**
     * The supported encodings when reading the raw secret from the storage
     */
    public enum SecretEncoding {
        BASE32
    }

    private final ApiKeyCredentialData credentialData;
    private final ApiKeySecretData secretData;

    private ApiKeyCredentialModel(String apiKey, String userId, int digits, int counter, int period, String algorithm) {
        this(apiKey, userId, digits, counter, period, algorithm, null);
    }

    private ApiKeyCredentialModel(String apiKey, String userId,  int digits, int counter, int period, String algorithm, String secretEncoding) {
        credentialData = new ApiKeyCredentialData(digits, counter, period, algorithm, secretEncoding);
        secretData = new ApiKeySecretData(apiKey, userId);
    }

    private ApiKeyCredentialModel(ApiKeyCredentialData credentialData, ApiKeySecretData secretData) {
        this.credentialData = credentialData;
        this.secretData = secretData;
    }

    public static ApiKeyCredentialModel createApiKey(String apiKey, String userId) {
        ApiKeyCredentialModel credentialModel = new ApiKeyCredentialModel(apiKey, userId, 0, 0, 0, "SHA1");
        credentialModel.fillCredentialModelFields();
        return credentialModel;
    }

    public static ApiKeyCredentialModel createFromCredentialModel(CredentialModel credentialModel) {
        try {
            ApiKeyCredentialData credentialData = JsonSerialization.readValue(credentialModel.getCredentialData(), ApiKeyCredentialData.class);
            ApiKeySecretData secretData = JsonSerialization.readValue(credentialModel.getSecretData(), ApiKeySecretData.class);

            return getApiKeyCredentialModel(credentialModel, credentialData, secretData);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

    }

    private static ApiKeyCredentialModel getApiKeyCredentialModel(CredentialModel credentialModel, ApiKeyCredentialData credentialData, ApiKeySecretData secretData) {
        ApiKeyCredentialModel otpCredentialModel = new ApiKeyCredentialModel(credentialData, secretData);
        otpCredentialModel.setUserLabel(credentialModel.getUserLabel());
        otpCredentialModel.setCreatedDate(credentialModel.getCreatedDate());
        otpCredentialModel.setType(TYPE);
        otpCredentialModel.setId(credentialModel.getId());
        otpCredentialModel.setSecretData(credentialModel.getSecretData());
        otpCredentialModel.setCredentialData(credentialModel.getCredentialData());
        return otpCredentialModel;
    }

    public void updateCounter(int counter) {
        credentialData.setCounter(counter);
        try {
            setCredentialData(JsonSerialization.writeValueAsString(credentialData));
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public ApiKeyCredentialData getApiKeyCredentialData() {
        return credentialData;
    }

    public ApiKeySecretData getApiKeySecretData() {
        return secretData;
    }

    public byte[] getDecodedSecret() {
        String encoding = credentialData.getSecretEncoding();

        if (encoding == null) {
            return secretData.getApiKey().getBytes(StandardCharsets.UTF_8);
        }

        try {
            if (SecretEncoding.BASE32.equals(SecretEncoding.valueOf(encoding.toUpperCase()))) {
                return Base32.decode(secretData.getApiKey());
            }

            throw new RuntimeException("Unsupported secret encoding: " + encoding);
        } catch (Exception cause) {
            throw new RuntimeException("Failed to decode otp secret using encoding [" + encoding + "]", cause);
        }
    }

    private void fillCredentialModelFields(){
        try {
            setCredentialData(JsonSerialization.writeValueAsString(credentialData));
            setSecretData(JsonSerialization.writeValueAsString(secretData));
            setType(TYPE);
            setCreatedDate(Time.currentTimeMillis());
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
}
