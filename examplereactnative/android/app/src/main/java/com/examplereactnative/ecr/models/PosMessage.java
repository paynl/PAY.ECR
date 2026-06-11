package com.examplereactnative.ecr.models;

import com.google.gson.annotations.SerializedName;

public class PosMessage {
    @SerializedName("type")
    public final String type;

    @SerializedName("transaction")
    public final PayNLTransaction transaction;

    @SerializedName("service")
    public final PayNLService service;

    @SerializedName("needle")
    public final String needle;

    public PosMessage(String type, PayNLTransaction transaction, PayNLService service, String needle) {
        this.type = type;
        this.transaction = transaction;
        this.service = service;
        this.needle = needle;
    }
}