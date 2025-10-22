package org.opendpp.credentials.apikey;

import org.keycloak.credential.CredentialModel;
import org.opendpp.enums.CustomCredentials;

public class ApiKeyCredential extends CredentialModel {

    public ApiKeyCredential() {
        setType(CustomCredentials.API_KEY.name());
    }
    
}
