package org.opendpp.credentials.apikey;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

public class ApiKeyCredentialData {
    private final int digits;
    private int counter;
    private final int period;
    private final String algorithm;

    private final String secretEncoding;

    @JsonCreator
    public ApiKeyCredentialData(@JsonProperty("digits") int digits,
                                @JsonProperty("counter") int counter,
                                @JsonProperty("period") int period,
                                @JsonProperty("algorithm") String algorithm,
                                @JsonProperty("secretEncoding") String secretEncoding) {
        this.digits = digits;
        this.counter = counter;
        this.period = period;
        this.algorithm = algorithm;
        this.secretEncoding = secretEncoding;
    }

    public int getDigits() {
        return digits;
    }

    public int getCounter() {
        return counter;
    }

    public void setCounter(int counter) {
        this.counter = counter;
    }

    public int getPeriod() {
        return period;
    }

    public String getAlgorithm() {
        return algorithm;
    }

    public String getSecretEncoding() {
        return secretEncoding;
    }
}
