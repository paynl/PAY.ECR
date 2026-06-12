package com.examplereactnative.ecr.models;

import com.google.gson.annotations.SerializedName;
import java.util.List;

public class PayNLOrder {

    @SerializedName("products")
    public final List<PayNLProduct> products;

    public PayNLOrder(List<PayNLProduct> products) {
        this.products = products;
    }
}