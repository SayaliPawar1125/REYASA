
package com.reyasa.reyasa_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record PlaceOrderRequest(
        @NotNull
        Long userId,

        @NotBlank(message = "Full name is required")
        @Size(max = 100)
        String fullName,

        @NotBlank(message = "Mobile number is required")
        @Pattern(
                regexp = "^[0-9]{10}$",
                message = "Enter a valid 10-digit mobile number"
        )
        String phone,

        @NotBlank(message = "House number and street are required")
        @Size(max = 150)
        String addressLine,

        @NotBlank(message = "Area is required")
        @Size(max = 100)
        String area,

        @NotBlank(message = "City is required")
        @Size(max = 80)
        String city,

        @NotBlank(message = "State is required")
        @Size(max = 80)
        String state,

        @NotBlank(message = "PIN code is required")
        @Pattern(
                regexp = "^[0-9]{6}$",
                message = "Enter a valid 6-digit PIN code"
        )
        String pinCode,

        @Size(max = 100)
        String landmark
) {}
