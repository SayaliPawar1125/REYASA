package com.reyasa.reyasa_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PaymentCreateResponse {

    private String id;

    private Long amount;

    private String currency;

    private String keyId;
}