package com.examplereactnative.ecr.models;

import com.google.gson.annotations.SerializedName;

public class PayNLProduct {

    @SerializedName("id")
    public final String id;

    @SerializedName("description")
    public final String description;

    @SerializedName("type")
    public final String type;

    @SerializedName("price")
    public final PayNLAmount price;

    @SerializedName("quantity")
    public final Integer quantity;

    @SerializedName("vatPercentage")
    public final Integer vatPercentage;

    public PayNLProduct(String id, String description, String type, PayNLAmount price,
                        Integer quantity, Integer vatPercentage) {
        this.id = id;
        this.description = description;
        this.type = type;
        this.price = price;
        this.quantity = quantity;
        this.vatPercentage = vatPercentage;
    }
}