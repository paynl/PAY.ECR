package com.examplereactnative.ecr.models;

import com.google.gson.annotations.SerializedName;

/**
 * PayNL Amount representation
 * Note: value is stored as cents (Int) and currency as ISO code
 */
public class PayNLAmount {

    @SerializedName("value")
    public final int value;

    @SerializedName("currency")
    public final String currency;

    public PayNLAmount(int value, String currency) {
        this.value = value;
        this.currency = currency;
    }
}