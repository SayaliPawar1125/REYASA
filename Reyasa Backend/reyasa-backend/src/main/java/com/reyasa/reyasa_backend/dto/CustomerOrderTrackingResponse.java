
package com.reyasa.reyasa_backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CustomerOrderTrackingResponse(
        Long id,
        BigDecimal totalAmount,
        String shippingName,
        String shippingPhone,
        String shippingAddress,
        String orderStatus,
        String paymentStatus,
        String paymentMethod,
        LocalDateTime createdAt,
        String courierName,
        String trackingNumber,
        String trackingUrl,
        LocalDateTime shippedAt,
        LocalDateTime deliveredAt
) {
}
