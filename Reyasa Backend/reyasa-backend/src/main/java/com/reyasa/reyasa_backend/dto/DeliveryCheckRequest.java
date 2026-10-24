package com.reyasa.reyasa_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class DeliveryCheckRequest {

    @NotBlank(message = "Delivery PIN code is required")
    @Pattern(
            regexp = "^[0-9]{6}$",
            message = "Enter a valid 6-digit PIN code"
    )
    private String pinCode;
}