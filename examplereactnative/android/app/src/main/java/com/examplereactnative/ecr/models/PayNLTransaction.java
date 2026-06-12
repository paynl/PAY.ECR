package com.examplereactnative.ecr.models;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.google.gson.annotations.SerializedName;

import java.util.ArrayList;
import java.util.List;

/**
 * See for more properties: https://developer.pay.nl/reference/api_create_order-1#body-params
 */
public class PayNLTransaction {

    // Possible types: PAYMENT, REFUND, AUTH
    @SerializedName("type")
    public final String type;

    @SerializedName("amount")
    public final PayNLAmount amount;

    @SerializedName("description")
    public final String description;

    @SerializedName("reference")
    public final String reference;

    @SerializedName("order")
    public final PayNLOrder order;

    public PayNLTransaction(String type, PayNLAmount amount, String description, String reference, PayNLOrder order) {
        this.type = type;
        this.amount = amount;
        this.description = description;
        this.reference = reference;
        this.order = order;
    }

    public static PayNLTransaction parseTransaction(ReadableMap transactionData) {
        if (transactionData == null) {
            return null;
        }

        String type;
        if (transactionData.hasKey("type")) {
            type = transactionData.getString("type");
        } else {
            type = "PAYMENT";
        }

        String description = "";
        if (transactionData.hasKey("description")) {
            description = transactionData.getString("description");
        }

        String reference = "";
        if (transactionData.hasKey("reference")) {
            reference = transactionData.getString("reference");
        }

        PayNLAmount amount = parseAmount(transactionData.getMap("amount"));
        PayNLOrder order = parseOrder(transactionData.getMap("order"));

        return new PayNLTransaction(type, amount, description, reference, order);
    }

    private static PayNLOrder parseOrder(ReadableMap orderData) {
        if (orderData == null) {
            return null;
        }

        List<PayNLProduct> products = null;
        if (orderData.hasKey("products") && !orderData.isNull("products")) {
            ReadableArray productsArray = orderData.getArray("products");
            products = parseProducts(productsArray);
        }

        return new PayNLOrder(products);
    }

    private static List<PayNLProduct> parseProducts(ReadableArray productsArray) {
        if (productsArray == null) {
            return new ArrayList<>();
        }

        List<PayNLProduct> products = new ArrayList<>();

        for (int i = 0; i < productsArray.size(); i++) {
            ReadableMap productData = productsArray.getMap(i);
            PayNLProduct product = parseProduct(productData);
            if (product != null) {
                products.add(product);
            }
        }

        return products;
    }

    private static PayNLProduct parseProduct(ReadableMap productData) {
        if (productData == null) {
            return null;
        }

        String id = null;
        if (productData.hasKey("id") && !productData.isNull("id")) {
            id = productData.getString("id");
        }

        String description = null;
        if (productData.hasKey("description") && !productData.isNull("description")) {
            description = productData.getString("description");
        }

        String type = null;
        if (productData.hasKey("type") && !productData.isNull("type")) {
            type = productData.getString("type");
        }

        PayNLAmount price = null;
        if (productData.hasKey("price") && !productData.isNull("price")) {
            price = parseAmount(productData.getMap("price"));
        }

        Integer quantity = null;
        if (productData.hasKey("quantity") && !productData.isNull("quantity")) {
            quantity = productData.getInt("quantity");
        }

        Integer vatPercentage = null;
        if (productData.hasKey("vatPercentage") && !productData.isNull("vatPercentage")) {
            vatPercentage = productData.getInt("vatPercentage");
        }

        return new PayNLProduct(
                id, description, type, price, quantity, vatPercentage
        );
    }

    private static PayNLAmount parseAmount(ReadableMap amountData) {
        if (amountData == null) {
            return new PayNLAmount(0, "EUR");
        }

        int value = 0;
        if (amountData.hasKey("value") && !amountData.isNull("value")) {
            value = amountData.getInt("value");
        }

        String currency = "EUR";
        if (amountData.hasKey("currency") && !amountData.isNull("currency")) {
            currency = amountData.getString("currency");
        }

        return new PayNLAmount(value, currency);
    }
}