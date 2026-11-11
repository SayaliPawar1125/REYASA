
package com.reyasa.reyasa_backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import lombok.Data;

import java.util.List;

@Data
public class CustomerOrderRequest {

    @NotEmpty
    private List<@NotNull Long> selectedCartItemIds;

    @NotBlank
    private String fullName;

    @NotBlank
    private String phone;

    @NotBlank
    private String addressLine;

    @NotBlank
    private String area;

    @NotBlank
    private String city;

    @NotBlank
    private String state;

    @NotBlank
    private String pinCode;

    private String landmark;

    @NotBlank
    @JsonProperty("paymentOrderId")
    private String razorpayOrderId;

    @NotBlank
    @JsonProperty("paymentId")
    private String razorpayPaymentId;

    @NotBlank
    private String razorpaySignature;
}
