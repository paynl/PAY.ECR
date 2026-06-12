package com.examplereactnative.ecr.models;

import com.google.gson.annotations.SerializedName;

public class PayNLService {
    @SerializedName("serviceId")
    public final String serviceId;

    @SerializedName("secret")
    public final String secret;

    public PayNLService(String serviceId, String secret) {
        this.serviceId = serviceId;
        this.secret = secret;
    }
}
