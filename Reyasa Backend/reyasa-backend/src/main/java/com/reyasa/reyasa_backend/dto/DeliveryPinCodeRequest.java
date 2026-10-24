
package com.reyasa.reyasa_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class DeliveryPinCodeRequest {

    @NotBlank(message = "PIN code is required")
    @Pattern(
            regexp = "^[0-9]{6}$",
            message = "PIN code must contain exactly 6 digits"
    )
    private String pinCode;
}
