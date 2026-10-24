
package com.reyasa.reyasa_backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DeliveryPinCodeStatusRequest {

    @NotNull(message = "Active status is required")
    private Boolean active;
}
