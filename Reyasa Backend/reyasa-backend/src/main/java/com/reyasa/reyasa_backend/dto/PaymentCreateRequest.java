package com.reyasa.reyasa_backend.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import lombok.Data;

import java.util.List;

@Data
public class PaymentCreateRequest {

    @NotEmpty(message = "Please select cart items")
    private List<@NotNull Long> selectedCartItemIds;
}