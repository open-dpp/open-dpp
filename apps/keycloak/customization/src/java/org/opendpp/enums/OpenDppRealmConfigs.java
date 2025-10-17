package org.opendpp.enums;

public enum OpenDppRealmConfigs {
    CLIENT_FRONTEND("frontend"),
    REALM_NAME("open-dpp");

    private final String value;

    OpenDppRealmConfigs(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
