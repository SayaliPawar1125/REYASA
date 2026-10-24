
package com.reyasa.reyasa_backend.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "delivery_pin_code",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_delivery_pin_code",
                        columnNames = "pin_code"
                )
        }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryPinCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "pin_code", nullable = false, length = 6)
    private String pinCode;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
