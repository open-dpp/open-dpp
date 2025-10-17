package org.opendpp.credentials.apikey;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

public class ApiKeySecretData {
    private final String apiKey;
    private final String userId;

    @JsonCreator
    public ApiKeySecretData(@JsonProperty("apiKey") String apiKey,
                            @JsonProperty("userId") String userId) {
        this.apiKey = apiKey;
        this.userId = userId;
    }

    public String getApiKey() {
        return apiKey;
    }

    public String getUserId() {
        return userId;
    }
}
