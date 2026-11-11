
package com.reyasa.reyasa_backend.entities;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "customer_orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Customer
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Order amount
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    // Shipping details
    private String shippingName;

    private String shippingPhone;

    @Column(length = 1000)
    private String shippingAddress;

    // Order status
    @Builder.Default
    private String orderStatus = "PLACED";

    // Payment status
    @Builder.Default
    private String paymentStatus = "PENDING";

    private String paymentMethod;

    // Razorpay payment details
    @Column(unique = true)
    private String razorpayOrderId;

    @Column(unique = true)
    private String razorpayPaymentId;

    // Courier and tracking details
    private String courierName;

    private String trackingNumber;

    @Column(length = 1000)
    private String trackingUrl;

    private LocalDateTime shippedAt;

    private LocalDateTime deliveredAt;

    // Timestamps
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {

        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();

        if (orderStatus == null) {
            orderStatus = "PLACED";
        }

        if (paymentStatus == null) {
            paymentStatus = "PENDING";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
